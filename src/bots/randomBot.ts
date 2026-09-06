import type { BotContext, BotDecision, ChessBot } from "./types";

/**
 * Picks a legal move at random. No network, no key, no latency — this is what
 * makes the skeleton iterate instantly (SPEC §11, milestone 1).
 */
export function createRandomBot(name: string): ChessBot {
  return {
    name,
    async decide(ctx: BotContext): Promise<BotDecision> {
      const san = ctx.legalMoves[Math.floor(Math.random() * ctx.legalMoves.length)];
      return { san, thinking: "", speech: "", stumble: false };
    },
  };
}
