import { useCallback, useEffect, useRef, useState } from "react";
import type { ChessBot } from "../bots/types";
import { detectTermination, legalMoves, replay } from "./engine";
import type { MatchResult, Ply, RunState, Side } from "./types";

export interface UseMatchOptions {
  bots: Record<Side, ChessBot>;
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
  play: () => void;
  pause: () => void;
  /** Advance exactly one ply. Only meaningful while paused. */
  step: () => void;
  reset: () => void;
}

export function useMatch({ bots, moveDelayMs = 350 }: UseMatchOptions): Match {
  const [plies, setPlies] = useState<Ply[]>([]);
  const [runState, setRunState] = useState<RunState>("idle");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [thinking, setThinking] = useState(false);

  // The log is also read inside async work, where state would be stale.
  const pliesRef = useRef(plies);
  pliesRef.current = plies;
  const botsRef = useRef(bots);
  botsRef.current = bots;
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
    const side = current.turn();
    const startedAt = Date.now();
    try {
      const decision = await botsRef.current[side].decide({
        side,
        fen: current.fen(),
        history: current.history(),
        legalMoves: legalMoves(current),
      });

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
    } finally {
      busyRef.current = false;
      setThinking(false);
    }
  }, []);

  // Autoplay: each appended ply re-runs this effect and schedules the next.
  useEffect(() => {
    if (runState !== "running") return;
    const timer = setTimeout(() => void runOnePly(), moveDelayMs);
    return () => clearTimeout(timer);
  }, [runState, plies.length, moveDelayMs, runOnePly]);

  const play = useCallback(() => {
    setRunState((s) => (s === "finished" ? s : "running"));
  }, []);

  const pause = useCallback(() => {
    setRunState((s) => (s === "running" ? "paused" : s));
  }, []);

  const step = useCallback(() => {
    setRunState((s) => (s === "running" ? "paused" : s));
    void runOnePly();
  }, [runOnePly]);

  const reset = useCallback(() => {
    setPlies([]);
    pliesRef.current = [];
    setResult(null);
    setRunState("idle");
  }, []);

  return { plies, runState, result, fen, toMove, thinking, play, pause, step, reset };
}
