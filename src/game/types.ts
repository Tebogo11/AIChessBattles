/** Which bot is to move. Matches chess.js's colour codes. */
export type Side = "w" | "b";

/**
 * One half-move, as stored. Append-only: a ply is written once and never
 * edited, which is what lets scrubbing and replay share a component (SPEC §5).
 */
export interface Ply {
  /** 0-based position in the match. */
  index: number;
  side: Side;
  /** The move in SAN, e.g. "Nf3". */
  san: string;
  /** Position after the move. */
  fenAfter: string;
  /** Private reasoning. Empty until a real model is wired up. */
  thinking: string;
  /** Public speech. Empty when the bot chose to stay quiet. */
  speech: string;
  /** True when the bot failed to produce a legal move and one was picked for it (SPEC §4.4). */
  stumble: boolean;
  durationMs: number;
}

export type TerminationReason =
  | "checkmate"
  | "stalemate"
  | "threefold-repetition"
  | "fifty-move-rule"
  | "insufficient-material"
  | "move-cap";

export interface MatchResult {
  /** The winning side, or null for any kind of draw. */
  winner: Side | null;
  reason: TerminationReason;
}

/** What the match runner is doing right now. */
export type RunState = "idle" | "running" | "paused" | "finished";

/** The in-flight decision, parsed from the still-growing response (SPEC §5, #7). */
export interface StreamingState {
  side: Side;
  thinking: string;
  speech: string;
}

export const TERMINATION_LABEL: Record<TerminationReason, string> = {
  checkmate: "Checkmate",
  stalemate: "Stalemate",
  "threefold-repetition": "Draw by threefold repetition",
  "fifty-move-rule": "Draw by the fifty-move rule",
  "insufficient-material": "Draw by insufficient material",
  "move-cap": "Adjudicated draw — move cap reached",
};
