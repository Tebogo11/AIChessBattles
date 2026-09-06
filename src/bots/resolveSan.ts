import { cleanMoveToken } from "./parseTaggedResponse";

/**
 * Resolve a model's raw <move> text to a legal SAN string, or null if it can't
 * be matched. Tries the verbatim text first, then a cleaned token, then a
 * case-insensitive match — the move is only ever accepted if it is in the legal
 * list, so this just improves the hit rate on near-correct answers (SPEC §4.4).
 */
export function resolveSan(rawMove: string, legalMoves: string[]): string | null {
  const raw = rawMove.trim();
  if (legalMoves.includes(raw)) return raw;

  const cleaned = cleanMoveToken(rawMove);
  if (cleaned && legalMoves.includes(cleaned)) return cleaned;

  const lower = cleaned.toLowerCase();
  const ci = legalMoves.find((m) => m.toLowerCase() === lower);
  return ci ?? null;
}

/** A uniformly random legal move, for the stumble fallback (SPEC §4.4). */
export function randomLegalMove(legalMoves: string[], rng: () => number = Math.random): string {
  return legalMoves[Math.floor(rng() * legalMoves.length)];
}
