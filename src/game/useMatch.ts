import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { botFromConfig } from "../bots/fromConfig";
import { parseTaggedResponse } from "../bots/parseTaggedResponse";
import type { ChessBot } from "../bots/types";
import type { BotConfig } from "./botConfig";
import { buildBotContext } from "./buildContext";
import { detectTermination, replay } from "./engine";
import type { MatchResult, Ply, RunState, Side, StreamingState } from "./types";

export interface UseMatchOptions {
  configs: Record<Side, BotConfig>;
  /** Pause between plies during autoplay, so a random game stays watchable. */
  moveDelayMs?: number;
}

export interface Match {
  plies: Ply[];
  runState: RunState;
  result: MatchResult | null;
  /** Position after the last stored ply. */
  fen: string;
  /** Side whose turn it is, or null once the match is over. */
  toMove: Side | null;
  /** True while a bot is deciding. */
  thinking: boolean;
  /** The in-flight reasoning/speech as it streams, or null between moves. */
  streaming: StreamingState | null;
  /** A provider's verbatim error after retries were exhausted, or null (SPEC §8). */
  error: string | null;
  play: () => void;
  pause: () => void;
  /** Advance exactly one ply. Only meaningful while paused. */
  step: () => void;
  reset: () => void;
}

export function useMatch({ configs, moveDelayMs = 350 }: UseMatchOptions): Match {
  const [plies, setPlies] = useState<Ply[]>([]);
  const [runState, setRunState] = useState<RunState>("idle");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [thinking, setThinking] = useState(false);
  const [streaming, setStreaming] = useState<StreamingState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bots = useMemo<Record<Side, ChessBot>>(
    () => ({ w: botFromConfig(configs.w), b: botFromConfig(configs.b) }),
    [configs],
  );

  // The log is also read inside async work, where state would be stale.
  const pliesRef = useRef(plies);
  pliesRef.current = plies;
  const botsRef = useRef(bots);
  botsRef.current = bots;
  const configsRef = useRef(configs);
  configsRef.current = configs;
  // One decision at a time. Autoplay and a manual step can both fire.
  const busyRef = useRef(false);

  const game = replay(plies.map((p) => p.san));
  const fen = game.fen();
  const toMove = result ? null : game.turn();

  const runOnePly = useCallback(async () => {
    if (busyRef.current) return;
    const log = pliesRef.current;
    const current = replay(log.map((p) => p.san));
    if (detectTermination(current)) return;

    busyRef.current = true;
    setThinking(true);
    const side = current.turn() as Side;
    setStreaming({ side, thinking: "", speech: "" });
    const startedAt = Date.now();
    try {
      const decision = await botsRef.current[side].decide(
        buildBotContext(side, current, log, configsRef.current),
        {
          // Parse the partial buffer so reasoning appears word by word (SPEC §5).
          onDelta: (buffer) => {
            const parsed = parseTaggedResponse(buffer);
            setStreaming({ side, thinking: parsed.thinking, speech: parsed.speech });
          },
        },
      );

      // The log may have moved on while we were away (reset, or a race).
      if (pliesRef.current !== log) return;

      current.move(decision.san);
      const ply: Ply = {
        index: log.length,
        side,
        san: decision.san,
        fenAfter: current.fen(),
        thinking: decision.thinking,
        speech: decision.speech,
        stumble: decision.stumble,
        durationMs: Date.now() - startedAt,
      };
      setPlies([...log, ply]);

      const termination = detectTermination(current);
      if (termination) {
        setResult(termination);
        setRunState("finished");
      }
    } catch (err) {
      // A provider failed after its retries: stall with the verbatim error and
      // wait for the user to resume. Never swap to another model (SPEC §8).
      setError(err instanceof Error ? err.message : String(err));
      setRunState("paused");
    } finally {
      busyRef.current = false;
      setThinking(false);
      // The completed ply is now in the log; the streamed fragments are transient.
      setStreaming(null);
    }
  }, []);

  // Autoplay: each appended ply re-runs this effect and schedules the next.
  useEffect(() => {
    if (runState !== "running") return;
    const timer = setTimeout(() => void runOnePly(), moveDelayMs);
    return () => clearTimeout(timer);
  }, [runState, plies.length, moveDelayMs, runOnePly]);

  const play = useCallback(() => {
    setError(null); // Resuming after a provider error retries the same model.
    setRunState((s) => (s === "finished" ? s : "running"));
  }, []);

  const pause = useCallback(() => {
    setRunState((s) => (s === "running" ? "paused" : s));
  }, []);

  const step = useCallback(() => {
    setError(null);
    setRunState((s) => (s === "running" ? "paused" : s));
    void runOnePly();
  }, [runOnePly]);

  const reset = useCallback(() => {
    setPlies([]);
    pliesRef.current = [];
    setResult(null);
    setRunState("idle");
    setStreaming(null);
    setError(null);
  }, []);

  return { plies, runState, result, fen, toMove, thinking, streaming, error, play, pause, step, reset };
}
