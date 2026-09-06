import type { Side } from "../game/types";

/**
 * Everything a bot is allowed to see on its turn. Opponent reasoning is
 * deliberately absent — that exclusion is a prompt-assembly rule and this type
 * is where it is enforced (SPEC §7).
 */
export interface BotContext {
  side: Side;
  fen: string;
  /** SAN history of the whole game so far. */
  history: string[];
  /** Every legal move, so the model chooses rather than derives (SPEC §4.1). */
  legalMoves: string[];
}

export interface BotDecision {
  /** SAN, guaranteed by the caller to be in `legalMoves`. */
  san: string;
  thinking: string;
  speech: string;
  /** True when the move was picked for the bot after it failed (SPEC §4.4). */
  stumble: boolean;
}

/**
 * One player. A random mover, an Ollama model and a hosted model are all the
 * same shape as far as the match runner is concerned.
 */
export interface ChessBot {
  readonly name: string;
  decide(ctx: BotContext, signal?: AbortSignal): Promise<BotDecision>;
}
