import { Chess } from "chess.js";
import type { Ply, Side } from "./types";

/** The piece types that can be captured — a king never is. */
export type CapturedPiece = "q" | "r" | "b" | "n" | "p";

/** Standard relative values, used only for the material-advantage badge. */
export const PIECE_VALUE: Record<CapturedPiece, number> = {
  q: 9,
  r: 5,
  b: 3,
  n: 3,
  p: 1,
};

/** Most valuable first, so the row reads as a ranking rather than a jumble. */
const BY_VALUE: CapturedPiece[] = ["q", "r", "b", "n", "p"];

/** What each side has taken off the board, most valuable first. */
export interface Captures {
  w: CapturedPiece[];
  b: CapturedPiece[];
}

/**
 * Captured pieces are derived, never stored: replaying the SAN a match already
 * has yields the captured piece for every capturing move, so seeded and shared
 * replays get this for free and the schema stays as it is (#15).
 *
 * `plyCount` is how many plies to apply — the same number the scrub cursor
 * reports as `viewingPly` — so the display always matches the position on
 * screen. chess.js reports en-passant captures as pawns and gives the piece
 * standing on the target square for a capture-promotion, so both fall out of
 * the replay without special handling.
 */
export function capturesAfter(plies: Ply[], plyCount: number): Captures {
  const game = new Chess();
  const taken: Captures = { w: [], b: [] };

  for (const ply of plies.slice(0, Math.max(0, plyCount))) {
    let move;
    try {
      move = game.move(ply.san);
    } catch {
      // A log that no longer replays cleanly is not worth crashing the board
      // over; stop where it stopped and show what was taken up to there.
      break;
    }
    if (move.captured) taken[move.color as Side].push(move.captured as CapturedPiece);
  }

  return { w: sortByValue(taken.w), b: sortByValue(taken.b) };
}

function sortByValue(pieces: CapturedPiece[]): CapturedPiece[] {
  return [...pieces].sort((a, b) => BY_VALUE.indexOf(a) - BY_VALUE.indexOf(b));
}

/** Total value of one side's haul. */
export function materialTaken(pieces: CapturedPiece[]): number {
  return pieces.reduce((sum, p) => sum + PIECE_VALUE[p], 0);
}

/**
 * Who is ahead on captured material and by how much, or null when level. Level
 * is the common case early on and deserves no badge at all.
 */
export function materialAdvantage(
  captures: Captures,
): { side: Side; points: number } | null {
  const diff = materialTaken(captures.w) - materialTaken(captures.b);
  if (diff === 0) return null;
  return diff > 0 ? { side: "w", points: diff } : { side: "b", points: -diff };
}

/**
 * Glyph for a captured piece, drawn in the colour of its owner — White's haul
 * is made of Black's pieces, so the glyphs shown against White are the dark
 * ones.
 */
export function captureGlyph(captor: Side, piece: CapturedPiece): string {
  const black: Record<CapturedPiece, string> = {
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟",
  };
  const white: Record<CapturedPiece, string> = {
    q: "♕",
    r: "♖",
    b: "♗",
    n: "♘",
    p: "♙",
  };
  return captor === "w" ? black[piece] : white[piece];
}

/** Long name for a piece, for the accessible label on a glyph row. */
export const PIECE_NAME: Record<CapturedPiece, string> = {
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};

/**
 * A spoken-word summary of a glyph row ("a queen, a rook and 2 pawns"), so the
 * row is not silence to a screen reader.
 */
export function describeCaptures(pieces: CapturedPiece[]): string {
  if (pieces.length === 0) return "nothing yet";
  const parts = BY_VALUE.filter((type) => pieces.includes(type)).map((type) => {
    const count = pieces.filter((p) => p === type).length;
    return count === 1 ? `a ${PIECE_NAME[type]}` : `${count} ${PIECE_NAME[type]}s`;
  });
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
