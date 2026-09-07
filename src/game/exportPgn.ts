import { Chess } from "chess.js";
import type { ExportInput } from "./exportMarkdown";
import type { MatchResult } from "./types";

/**
 * Reasoning is unbounded — a chatty model can produce a paragraph per move —
 * and a PGN whose comments dwarf its movetext is unreadable in every viewer.
 * Enough to recognise the thought, not enough to bloat the file.
 */
export const COMMENT_LIMIT = 200;

/** The PGN Result tag. `*` is the standard marker for an unfinished game. */
export function resultTag(result: MatchResult | null): string {
  if (!result) return "*";
  if (!result.winner) return "1/2-1/2";
  return result.winner === "w" ? "1-0" : "0-1";
}

/**
 * A PGN comment is delimited by braces and cannot contain them, and newlines
 * inside one break naive parsers. Flatten and strip rather than escape, because
 * there is no escape in the PGN grammar.
 */
export function toComment(text: string, limit = COMMENT_LIMIT): string {
  const flat = text.replace(/[{}]/g, "").replace(/\s+/g, " ").trim();
  if (flat.length <= limit) return flat;
  return `${flat.slice(0, limit - 1).trimEnd()}…`;
}

/**
 * The match as a standard PGN: seven-tag roster, the movetext, and each bot's
 * reasoning attached to its own move as a comment, so the file carries the
 * story with it into any third-party viewer.
 *
 * Built through chess.js rather than by string assembly so the movetext,
 * numbering and comment placement follow the standard rather than a guess.
 */
export function matchPgn(input: ExportInput, now: Date = new Date()): string {
  const { plies, whiteName, blackName, result } = input;
  const game = new Chess();

  game.setHeader("Event", "AI Chess Battles");
  game.setHeader("Site", "AI Chess Battles");
  game.setHeader("Date", pgnDate(now));
  game.setHeader("Round", "-");
  game.setHeader("White", whiteName);
  game.setHeader("Black", blackName);
  game.setHeader("Result", resultTag(result));

  for (const ply of plies) {
    try {
      game.move(ply.san);
    } catch {
      // Stop at the first move that will not replay rather than emitting a PGN
      // that no viewer can open.
      break;
    }
    const note = [ply.stumble ? "stumble:" : "", ply.thinking].filter(Boolean).join(" ");
    const comment = toComment(note);
    if (comment) game.setComment(comment);
  }

  return game.pgn({ newline: "\n" });
}

/** PGN dates are YYYY.MM.DD. */
function pgnDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}
