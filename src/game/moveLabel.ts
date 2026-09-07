/**
 * How a ply is written in chess notation: "12." for White, "12..." for Black.
 * Shared by both exports so the Markdown and the PGN agree about move numbers.
 */
export function moveLabel(plyIndex: number): string {
  const fullMove = Math.floor(plyIndex / 2) + 1;
  return plyIndex % 2 === 0 ? `${fullMove}.` : `${fullMove}...`;
}

/** A filename stem like "alice-vs-bob", safe on every filesystem. */
export function matchSlug(whiteName: string, blackName: string): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "bot";
  return `${clean(whiteName)}-vs-${clean(blackName)}`;
}
