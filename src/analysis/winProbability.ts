import type { Side } from "../game/types";

/**
 * An engine's verdict on a position, exactly as UCI reports it: **relative to
 * the side to move**. A `mate` of -3 means the side to move gets mated in
 * three. Keeping the raw point of view here — rather than normalising at the
 * parser — makes the flip a single, testable step.
 */
export interface EngineScore {
  /** Centipawns, when the engine sees no forced mate. */
  cp?: number;
  /** Moves to mate. Positive: the side to move mates. Negative: it is mated. */
  mate?: number;
}

/** The Lichess conversion constant. */
export const LICHESS_K = 0.00368208;

/**
 * Centipawns to a 0–100 win probability using the curve Lichess fits to real
 * game outcomes. An even position is 50; the curve saturates smoothly, so a
 * single blunder cannot flatten the rest of the chart.
 */
export function winProbabilityFromCp(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-LICHESS_K * cp)) - 1);
}

/**
 * Re-express a score from White's point of view. Without this the line zigzags
 * between plies and means nothing, because the engine keeps swapping whose
 * advantage it is reporting.
 */
export function toWhitePov(score: EngineScore, sideToMove: Side): EngineScore {
  if (sideToMove === "w") return score;
  return {
    ...(score.cp !== undefined ? { cp: -score.cp } : {}),
    ...(score.mate !== undefined ? { mate: -score.mate } : {}),
  };
}

/**
 * A single point on the chart: 0–100, always from White's perspective.
 *
 * The point-of-view flip happens **before** a mate is resolved to 100 or 0,
 * because the sign is what decides which end of the axis the mate belongs at.
 * Doing it the other way round pins every mate to the same end.
 */
export function winProbability(score: EngineScore, sideToMove: Side): number {
  const white = toWhitePov(score, sideToMove);
  if (white.mate !== undefined) {
    // Mate in 0 is the mated side to move: the mate has already landed.
    return white.mate > 0 ? 100 : 0;
  }
  return winProbabilityFromCp(white.cp ?? 0);
}

/**
 * Pull the score out of one UCI `info` line, or null when the line carries no
 * score (`info string`, `currmove` progress reports and the like).
 */
export function parseInfoScore(line: string): EngineScore | null {
  const cp = /\bscore cp (-?\d+)/.exec(line);
  if (cp) return { cp: Number(cp[1]) };
  const mate = /\bscore mate (-?\d+)/.exec(line);
  if (mate) return { mate: Number(mate[1]) };
  return null;
}
