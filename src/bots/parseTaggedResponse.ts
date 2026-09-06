/**
 * A model reply is three tagged sections in a fixed order (SPEC §4.2):
 *
 *   <thinking>...</thinking>
 *   <speech>...</speech>
 *   <move>Nf3</move>
 *
 * Tags are used instead of JSON because they stream natively and small local
 * models mangle a closing tag far less often than they emit malformed JSON.
 * This parser is deliberately tolerant so the same function works on a partial,
 * still-growing buffer (used for live streaming in #7): a section runs from its
 * opening tag until its closing tag, or the next section's opening tag, or the
 * end of what has arrived so far.
 */
export interface ParsedResponse {
  thinking: string;
  speech: string;
  /** Raw contents of <move>, trimmed. Validation happens against legal moves. */
  move: string;
}

const SECTIONS = ["thinking", "speech", "move"] as const;
type Section = (typeof SECTIONS)[number];

const OPEN: Record<Section, RegExp> = {
  thinking: /<thinking>/i,
  speech: /<speech>/i,
  move: /<move>/i,
};
const CLOSE: Record<Section, RegExp> = {
  thinking: /<\/thinking>/i,
  speech: /<\/speech>/i,
  move: /<\/move>/i,
};

/** Extract one section's text, tolerating a missing closing tag mid-stream. */
function extract(buffer: string, section: Section): string {
  const open = OPEN[section].exec(buffer);
  if (!open) return "";
  const start = open.index + open[0].length;

  const close = CLOSE[section].exec(buffer.slice(start));
  if (close) return buffer.slice(start, start + close.index).trim();

  // No closing tag yet: run until the next section's opening tag, or the end.
  let end = buffer.length;
  for (const other of SECTIONS) {
    if (other === section) continue;
    const nextOpen = OPEN[other].exec(buffer.slice(start));
    if (nextOpen) end = Math.min(end, start + nextOpen.index);
  }
  return buffer.slice(start, end).trim();
}

export function parseTaggedResponse(buffer: string): ParsedResponse {
  return {
    thinking: extract(buffer, "thinking"),
    speech: extract(buffer, "speech"),
    move: extract(buffer, "move"),
  };
}

/**
 * The move as written by a model, cleaned to a bare SAN token: strip a leading
 * move number ("12." / "12..."), surrounding punctuation and whitespace. The
 * result is still validated against the legal-move list — this only improves the
 * hit rate on otherwise-correct answers.
 */
export function cleanMoveToken(raw: string): string {
  return raw
    .replace(/^\s*\d+\.+\s*/, "")
    .replace(/[.,!?;:"'`]+$/g, "")
    .trim()
    .split(/\s+/)[0] ?? "";
}
