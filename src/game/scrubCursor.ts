/**
 * Pure cursor math for scrubbing, split out so it can be tested without a
 * renderer. A cursor of `null` means "follow the live edge"; otherwise it is a
 * ply index being viewed, where -1 is the start position (SPEC §5).
 */

/** Collapse a cursor that has fallen to or past the live edge back to null. */
export function normalize(cursor: number | null, total: number): number | null {
  return cursor !== null && cursor < total - 1 ? cursor : null;
}

export function stepBack(cursor: number | null, total: number): number {
  const from = cursor === null ? total - 1 : cursor;
  return Math.max(-1, from - 1);
}

export function stepForward(cursor: number | null, total: number): number | null {
  if (cursor === null) return null;
  const next = cursor + 1;
  return next >= total - 1 ? null : next;
}

/** True when the normalized cursor is viewing history rather than the live edge. */
export function isScrubbing(cursor: number | null, total: number): boolean {
  return normalize(cursor, total) !== null;
}
