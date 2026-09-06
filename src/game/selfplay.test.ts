import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { createRandomBot } from "../bots/randomBot";
import { detectTermination, legalMoves } from "./engine";
import type { MatchResult, Side } from "./types";

/**
 * The same loop the runner hook drives, minus React — enough to prove a
 * random-vs-random match always reaches a termination.
 */
async function playOut(): Promise<{ result: MatchResult; plies: number }> {
  const bots: Record<Side, ReturnType<typeof createRandomBot>> = {
    w: createRandomBot("White"),
    b: createRandomBot("Black"),
  };
  const game = new Chess();
  for (let plies = 0; ; plies++) {
    const result = detectTermination(game);
    if (result) return { result, plies };
    const side = game.turn();
    const moves = legalMoves(game);
    const decision = await bots[side].decide({
      side,
      fen: game.fen(),
      history: game.history(),
      legalMoves: moves,
    });
    expect(moves).toContain(decision.san);
    game.move(decision.san);
  }
}

describe("random self-play", () => {
  it("always terminates, within the move cap", async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 8; i++) {
      const { result, plies } = await playOut();
      seen.add(result.reason);
      // The cap bites at full move 151, i.e. after 300 plies at the latest.
      expect(plies).toBeLessThanOrEqual(302);
    }
    // Random play mostly draws; an empty set would mean the loop never ran.
    expect(seen.size).toBeGreaterThan(0);
  }, 120_000);
});
