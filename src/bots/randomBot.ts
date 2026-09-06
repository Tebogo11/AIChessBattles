import { randomLegalMove } from "./resolveSan";
import type { BotContext, BotDecision, ChessBot } from "./types";

/**
 * Picks a legal move at random. No network, no key, no latency — this is what
 * makes the skeleton iterate instantly, and it is also the fallback when a real
 * provider isn't wired up yet (SPEC §11).
 */
export function createRandomBot(name: string): ChessBot {
  return {
    name,
    async decide(ctx: BotContext): Promise<BotDecision> {
      return { san: randomLegalMove(ctx.legalMoves), thinking: "", speech: "", stumble: false };
    },
  };
}
