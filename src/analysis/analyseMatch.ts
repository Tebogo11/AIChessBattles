import { Chess } from "chess.js";
import type { Ply, Side } from "../game/types";
import type { EvalEngine } from "./evalEngine";
import { DEFAULT_DEPTH } from "./evalEngine";
import { winProbability } from "./winProbability";

/** One point on the win-probability curve, always from White's perspective. */
export interface EvalPoint {
  /** 0 is the start position; n is the position after ply n-1. */
  ply: number;
  /** 0–100. */
  winPct: number;
}

export interface AnalyseOptions {
  plies: Ply[];
  engine: EvalEngine;
  depth?: number;
  signal?: AbortSignal;
  /** Called as each point resolves, so the chart fills in while it runs. */
  onPoint?: (point: EvalPoint, done: number, total: number) => void;
}

/** The side to move, read off the FEN's second field. */
export function sideToMoveOf(fen: string): Side {
  return fen.split(" ")[1] === "b" ? "b" : "w";
}

/**
 * Walk the game one position at a time and turn each engine score into a point
 * on the curve. Positions are rebuilt from the stored SAN rather than trusting
 * `fenAfter`, so a fixture or an older row without one still analyses.
 *
 * Points are emitted as they resolve rather than in a batch at the end: a full
 * game takes tens of seconds and a chart that fills in is worth more than a
 * chart that appears.
 */
export async function analyseMatch({
  plies,
  engine,
  depth = DEFAULT_DEPTH,
  signal,
  onPoint,
}: AnalyseOptions): Promise<EvalPoint[]> {
  const game = new Chess();
  const positions: string[] = [game.fen()];
  for (const ply of plies) {
    try {
      game.move(ply.san);
    } catch {
      break;
    }
    positions.push(game.fen());
  }

  const points: EvalPoint[] = [];
  for (const [index, fen] of positions.entries()) {
    if (signal?.aborted) break;
    const score = await engine.evaluate(fen, depth, signal);
    if (signal?.aborted) break;
    // A position with no score at all is a terminal one — mate or stalemate on
    // the board — so it inherits the last point rather than punching a hole in
    // the line.
    const winPct = score
      ? winProbability(score, sideToMoveOf(fen))
      : (points[points.length - 1]?.winPct ?? 50);
    const point: EvalPoint = { ply: index, winPct };
    points.push(point);
    onPoint?.(point, points.length, positions.length);
  }

  return points;
}
