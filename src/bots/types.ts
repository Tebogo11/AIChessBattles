import type { Side } from "../game/types";

/** One entry in the shared, public speech log. Both bots' speech is visible. */
export interface SpeechEntry {
  side: Side;
  /** Display name of the speaker, for legibility in the prompt. */
  name: string;
  text: string;
}

/**
 * Everything a bot is allowed to see on its turn. Opponent *reasoning* is
 * deliberately absent — that exclusion is a prompt-assembly rule, enforced where
 * this context is built, not a security boundary (SPEC §4.1, §7).
 */
export interface BotContext {
  side: Side;
  /** The persona / system instructions for this bot. */
  systemPrompt: string;
  fen: string;
  /** SAN history of the whole game so far. */
  history: string[];
  /** Every legal move, so the model chooses rather than derives (SPEC §4.1). */
  legalMoves: string[];
  /** This bot's own reasoning from roughly the last 6 plies. */
  ownRecentReasoning: string[];
  /** The full shared speech log — both bots (SPEC §4.1). */
  speechLog: SpeechEntry[];
}

export interface BotDecision {
  /** SAN, guaranteed by the caller to be in `legalMoves`. */
  san: string;
  thinking: string;
  speech: string;
  /** True when the move was picked for the bot after it failed (SPEC §4.4). */
  stumble: boolean;
}

/** Optional hooks for a decision in progress (live streaming, cancellation). */
export interface DecideOptions {
  signal?: AbortSignal;
  /** Called with the growing raw buffer as tokens arrive (used by #7). */
  onDelta?: (buffer: string) => void;
}

/**
 * One player. A random mover, an Ollama model and a hosted model are all the
 * same shape as far as the match runner is concerned.
 */
export interface ChessBot {
  readonly name: string;
  decide(ctx: BotContext, opts?: DecideOptions): Promise<BotDecision>;
}
