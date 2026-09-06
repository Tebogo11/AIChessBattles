import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { botFromConfig } from "../bots/fromConfig";
import { detectTermination, legalMoves, replay } from "./engine";
import { toPly } from "./toPly";
import type { Match } from "./useMatch";
import type { RunState, Side } from "./types";

/**
 * The persisted twin of {@link useMatch}. Same surface, but the ply log lives in
 * Convex: every completed ply is appended as it happens, and opening the match
 * URL in a fresh tab rebuilds the game from stored history (SPEC §7, §8).
 */
export function usePersistedMatch(matchId: Id<"matches">): Match | null {
  const match = useQuery(api.matches.get, { matchId });
  const rows = useQuery(api.plies.list, { matchId });
  const append = useMutation(api.plies.append);
  const finish = useMutation(api.matches.finish);

  // Local pause is per-tab and not persisted: pausing one viewer shouldn't stop
  // the match for everyone. The match doc's status is the durable state.
  const [paused, setPaused] = useState(false);
  const [thinking, setThinking] = useState(false);
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

  const runState: RunState = !match
    ? "idle"
    : match.status === "finished" || liveResult
      ? "finished"
      : paused || match.status === "stalled"
        ? "paused"
        : "running";

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
    const config = side === "w" ? m.white : m.black;
    const startedAt = Date.now();
    try {
      const decision = await botFromConfig(config).decide({
        side,
        fen: current.fen(),
        history: current.history(),
        legalMoves: legalMoves(current),
      });
      current.move(decision.san);
      // Idempotent on (matchId, index): a duplicate append is a no-op, so a
      // regenerated move after a tab death can't create a second ply.
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
    } finally {
      busyRef.current = false;
      setThinking(false);
    }
  }, [append, finish, matchId]);

  // Drive autoplay: each appended ply re-runs this and schedules the next.
  useEffect(() => {
    if (runState !== "running") return;
    const timer = setTimeout(() => void runOnePly(), 350);
    return () => clearTimeout(timer);
  }, [runState, plies.length, runOnePly]);

  const play = useCallback(() => setPaused(false), []);
  const pause = useCallback(() => setPaused(true), []);
  const step = useCallback(() => {
    setPaused(true);
    void runOnePly();
  }, [runOnePly]);
  const reset = useCallback(() => {
    // A persisted match is immutable history; "new game" is a navigation, not a
    // truncation. Handled by the route, so this is a no-op here.
  }, []);

  if (match === undefined || rows === undefined) return null;

  return {
    plies,
    runState,
    result: liveResult,
    fen,
    toMove,
    thinking,
    play,
    pause,
    step,
    reset,
  };
}
