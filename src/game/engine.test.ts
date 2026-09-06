import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { MAX_FULL_MOVES, detectTermination, replay } from "./engine";

describe("detectTermination", () => {
  it("returns null for a live game", () => {
    expect(detectTermination(new Chess())).toBeNull();
  });

  it("names the winner on checkmate", () => {
    const game = replay(["f3", "e5", "g4", "Qh4#"]);
    expect(detectTermination(game)).toEqual({ winner: "b", reason: "checkmate" });
  });

  it("detects stalemate", () => {
    const game = new Chess("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
    expect(detectTermination(game)).toEqual({ winner: null, reason: "stalemate" });
  });

  it("detects threefold repetition", () => {
    const shuffle = ["Nf3", "Nf6", "Ng1", "Ng8"];
    const game = replay([...shuffle, ...shuffle]);
    expect(detectTermination(game)).toEqual({
      winner: null,
      reason: "threefold-repetition",
    });
  });

  it("detects insufficient material", () => {
    const game = new Chess("8/8/8/4k3/8/4K3/8/8 w - - 0 1");
    expect(detectTermination(game)).toEqual({
      winner: null,
      reason: "insufficient-material",
    });
  });

  it("detects the fifty-move rule", () => {
    const game = new Chess("8/8/8/4k3/8/4K3/8/R6r w - - 100 60");
    expect(detectTermination(game)).toEqual({ winner: null, reason: "fifty-move-rule" });
  });

  it("adjudicates a draw past the move cap", () => {
    const game = new Chess(`8/8/8/4k3/8/4K3/8/R6r w - - 0 ${MAX_FULL_MOVES + 1}`);
    expect(detectTermination(game)).toEqual({ winner: null, reason: "move-cap" });
  });

  it("leaves a game at exactly the move cap running", () => {
    const game = new Chess(`8/8/8/4k3/8/4K3/8/R6r w - - 0 ${MAX_FULL_MOVES}`);
    expect(detectTermination(game)).toBeNull();
  });
});

describe("replay", () => {
  it("rebuilds the same position from the move log", () => {
    const sans = ["e4", "e5", "Nf3", "Nc6", "Bb5"];
    expect(replay(sans).history()).toEqual(sans);
  });
});
