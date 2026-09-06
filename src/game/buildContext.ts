import type { Chess } from "chess.js";
import type { BotContext, SpeechEntry } from "../bots/types";
import type { BotConfig } from "./botConfig";
import { legalMoves } from "./engine";
import type { Ply, Side } from "./types";

/** How many of a bot's own recent reasoning entries to feed back (SPEC §4.1). */
export const RECENT_REASONING = 6;

/**
 * Build the context a bot sees this turn from the shared ply log. This is the
 * one place the log becomes a bot's view: it includes the bot's own recent
 * reasoning and the full shared speech log, and — by never reading the
 * opponent's reasoning — enforces the hidden-thoughts rule (SPEC §4.1, §7).
 */
export function buildBotContext(
  side: Side,
  game: Chess,
  plies: Ply[],
  configs: Record<Side, BotConfig>,
): BotContext {
  const ownRecentReasoning = plies
    .filter((p) => p.side === side && p.thinking.trim().length > 0)
    .slice(-RECENT_REASONING)
    .map((p) => p.thinking);

  const speechLog: SpeechEntry[] = plies
    .filter((p) => p.speech.trim().length > 0)
    .map((p) => ({ side: p.side, name: configs[p.side].name, text: p.speech }));

  return {
    side,
    systemPrompt: configs[side].prompt,
    fen: game.fen(),
    history: game.history(),
    legalMoves: legalMoves(game),
    ownRecentReasoning,
    speechLog,
  };
}
