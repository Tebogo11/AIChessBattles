import { Chess } from "chess.js";
import type { MatchResult, Side } from "./types";

/**
 * Hard cap on full moves. Weak models shuffle pieces forever; without this some
 * matches never end (SPEC §4.5).
 */
export const MAX_FULL_MOVES = 150;

export const START_FEN = new Chess().fen();

/**
 * Rebuild a position from the move log. The log is the source of truth, so
 * every consumer — live board, scrub cursor, replay — derives from it the same
 * way. Cheap: a match is at most a few hundred plies.
 */
export function replay(sans: string[]): Chess {
  const game = new Chess();
  for (const san of sans) game.move(san);
  return game;
}

export function legalMoves(game: Chess): string[] {
  return game.moves();
}

export function sideToMove(game: Chess): Side {
  return game.turn();
}

/** Null while the game is still alive. */
export function detectTermination(game: Chess): MatchResult | null {
  if (game.isCheckmate()) {
    // The side to move is the one that got mated.
    return { winner: game.turn() === "w" ? "b" : "w", reason: "checkmate" };
  }
  if (game.isStalemate()) return { winner: null, reason: "stalemate" };
  if (game.isThreefoldRepetition()) {
    return { winner: null, reason: "threefold-repetition" };
  }
  if (game.isInsufficientMaterial()) {
    return { winner: null, reason: "insufficient-material" };
  }
  if (game.isDrawByFiftyMoves()) {
    return { winner: null, reason: "fifty-move-rule" };
  }
  if (game.moveNumber() > MAX_FULL_MOVES) {
    return { winner: null, reason: "move-cap" };
  }
  return null;
}
