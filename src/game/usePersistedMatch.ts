import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { botFromConfig } from "../bots/fromConfig";
import { parseTaggedResponse } from "../bots/parseTaggedResponse";
import { buildBotContext } from "./buildContext";
import { detectTermination, replay } from "./engine";
import { toPly } from "./toPly";
import type { Match } from "./useMatch";
import type { RunState, Side, StreamingState } from "./types";

/**
 * A match still marked "running" but silent for this long is treated as stalled:
 * the tab that was driving it went away without cleanly marking it. Detecting
 * staleness this way is more reliable than depending on an unload handler, which
 * browsers do not guarantee to run (SPEC §8).
 */
const STALE_MS = 15_000;

export interface PersistedMatch {
  /** Null while loading or when the match is not found. */
  view: Match | null;
  /** The stored match document, once loaded. */
  doc: Doc<"matches"> | null;
  /** True when the match needs an explicit Resume before it will drive. */
  resumeNeeded: boolean;
  resume: () => void;
  /** True once both queries have resolved. */
  loaded: boolean;
  notFound: boolean;
}

/**
 * The persisted twin of {@link useMatch}. Same view surface, but the ply log
 * lives in Convex: every completed ply is appended as it happens, and opening
 * the match URL in a fresh tab rebuilds the game from stored history. A stalled
 * match is not driven until the viewer resumes it (SPEC §7, §8).
 */
export function usePersistedMatch(matchId: Id<"matches">): PersistedMatch {
  const match = useQuery(api.matches.get, { matchId });
  const rows = useQuery(api.plies.list, { matchId });
  const append = useMutation(api.plies.append);
  const finish = useMutation(api.matches.finish);
  const markStalled = useMutation(api.matches.markStalled);
  const resumeMutation = useMutation(api.matches.resume);

  const [paused, setPaused] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [streaming, setStreaming] = useState<StreamingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Once the viewer resumes, this tab may drive even if the doc was briefly
  // still flagged stalled/stale.
  const [resumed, setResumed] = useState(false);
  const busyRef = useRef(false);

  const plies = (rows ?? []).map(toPly);
  const pliesRef = useRef(plies);
  pliesRef.current = plies;
  const matchRef = useRef(match);
  matchRef.current = match;

  const game = replay(plies.map((p) => p.san));
  const storedResult =
    match && match.status === "finished" && match.terminationReason
      ? { winner: match.winner, reason: match.terminationReason }
      : null;
  const liveResult = storedResult ?? detectTermination(game);
  const fen = game.fen();
  const toMove = liveResult ? null : (game.turn() as Side);

  const finished = Boolean(match && (match.status === "finished" || liveResult));
  const stale =
    !!match && match.status === "running" && Date.now() - match.lastActivityAt > STALE_MS;
  const resumeNeeded =
    !!match && !finished && !resumed && (match.status === "stalled" || stale);

  const runState: RunState = !match
    ? "idle"
    : finished
      ? "finished"
      : paused || resumeNeeded
        ? "paused"
        : "running";

  // Best-effort: mark a running match stalled when this tab goes away. Not
  // relied upon — staleness detection above is the real safety net.
  useEffect(() => {
    const onHide = () => {
      if (matchRef.current?.status === "running") void markStalled({ matchId });
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [markStalled, matchId]);

  const runOnePly = useCallback(async () => {
    if (busyRef.current) return;
    const m = matchRef.current;
    if (!m) return;
    const log = pliesRef.current;
    const current = replay(log.map((p) => p.san));
    const already = detectTermination(current);
    if (already) {
      if (m.status !== "finished") {
        await finish({ matchId, winner: already.winner, terminationReason: already.reason });
      }
      return;
    }

    busyRef.current = true;
    setThinking(true);
    const side = current.turn() as Side;
    setStreaming({ side, thinking: "", speech: "" });
    const config = side === "w" ? m.white : m.black;
    const startedAt = Date.now();
    try {
      const decision = await botFromConfig(config).decide(
        buildBotContext(side, current, log, { w: m.white, b: m.black }),
        {
          onDelta: (buffer) => {
            const parsed = parseTaggedResponse(buffer);
            setStreaming({ side, thinking: parsed.thinking, speech: parsed.speech });
          },
        },
      );
      current.move(decision.san);
      // Idempotent on (matchId, index): a duplicate append is a no-op, so a
      // move regenerated after a tab death can't create a second ply.
      await append({
        matchId,
        index: log.length,
        side,
        san: decision.san,
        fenAfter: current.fen(),
        thinking: decision.thinking,
        speech: decision.speech,
        stumble: decision.stumble,
        durationMs: Date.now() - startedAt,
      });

      const termination = detectTermination(current);
      if (termination) {
        await finish({ matchId, winner: termination.winner, terminationReason: termination.reason });
      }
    } catch (err) {
      // A provider failed after its retries: stall the match (so any tab can
      // resume it) and show the verbatim error. Never swap models (SPEC §8).
      setError(err instanceof Error ? err.message : String(err));
      await markStalled({ matchId });
    } finally {
      busyRef.current = false;
      setThinking(false);
      // The completed ply is now stored; the streamed fragments are transient.
      setStreaming(null);
    }
  }, [append, finish, markStalled, matchId]);

  // Drive autoplay: each appended ply re-runs this and schedules the next.
  useEffect(() => {
    if (runState !== "running") return;
    const timer = setTimeout(() => void runOnePly(), 350);
    return () => clearTimeout(timer);
  }, [runState, plies.length, runOnePly]);

  const play = useCallback(() => {
    setError(null);
    setPaused(false);
  }, []);
  const pause = useCallback(() => setPaused(true), []);
  const step = useCallback(() => {
    setError(null);
    setPaused(true);
    void runOnePly();
  }, [runOnePly]);
  const reset = useCallback(() => {
    // A persisted match is immutable history; "new game" is a navigation, not a
    // truncation. Handled by the route.
  }, []);

  const resume = useCallback(() => {
    setResumed(true);
    setPaused(false);
    setError(null);
    void resumeMutation({ matchId });
  }, [resumeMutation, matchId]);

  const loaded = match !== undefined && rows !== undefined;
  const view: Match | null =
    loaded && match
      ? { plies, runState, result: liveResult, fen, toMove, thinking, streaming, error, play, pause, step, reset }
      : null;

  return {
    view,
    doc: match ?? null,
    resumeNeeded,
    resume,
    loaded,
    notFound: match === null,
  };
}
