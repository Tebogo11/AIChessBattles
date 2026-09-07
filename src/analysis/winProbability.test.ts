import { describe, expect, it } from "vitest";
import {
  parseInfoScore,
  toWhitePov,
  winProbability,
  winProbabilityFromCp,
} from "./winProbability";

describe("winProbabilityFromCp", () => {
  it("maps a dead-level position to the midpoint", () => {
    expect(winProbabilityFromCp(0)).toBeCloseTo(50, 10);
  });

  it("is symmetric about the midpoint", () => {
    for (const cp of [50, 200, 900]) {
      expect(winProbabilityFromCp(cp) + winProbabilityFromCp(-cp)).toBeCloseTo(100, 6);
    }
  });

  it("rises with the advantage and stays inside the axis", () => {
    expect(winProbabilityFromCp(100)).toBeGreaterThan(winProbabilityFromCp(50));
    expect(winProbabilityFromCp(10_000)).toBeLessThanOrEqual(100);
    expect(winProbabilityFromCp(-10_000)).toBeGreaterThanOrEqual(0);
  });
});

describe("toWhitePov", () => {
  it("leaves a score alone when White is to move", () => {
    expect(toWhitePov({ cp: 120 }, "w")).toEqual({ cp: 120 });
    expect(toWhitePov({ mate: 3 }, "w")).toEqual({ mate: 3 });
  });

  it("flips the sign when Black is to move", () => {
    expect(toWhitePov({ cp: 120 }, "b")).toEqual({ cp: -120 });
    expect(toWhitePov({ mate: -3 }, "b")).toEqual({ mate: 3 });
  });
});

describe("winProbability", () => {
  it("reads a side-to-move advantage as White's when White moves", () => {
    expect(winProbability({ cp: 300 }, "w")).toBeGreaterThan(50);
  });

  it("reads the same score as Black's when Black moves", () => {
    // Without the flip the line zigzags between plies and means nothing.
    expect(winProbability({ cp: 300 }, "b")).toBeLessThan(50);
    expect(winProbability({ cp: 300 }, "b")).toBeCloseTo(100 - winProbability({ cp: 300 }, "w"), 6);
  });

  it("pins a mate to the end of the axis belonging to the mating side", () => {
    expect(winProbability({ mate: 3 }, "w")).toBe(100); // White mates
    expect(winProbability({ mate: -3 }, "w")).toBe(0); // White gets mated
    // The flip has to happen before the mate is resolved, or both of these
    // land at the same end.
    expect(winProbability({ mate: 3 }, "b")).toBe(0); // Black mates
    expect(winProbability({ mate: -3 }, "b")).toBe(100); // Black gets mated
  });

  it("treats a landed mate as decisive", () => {
    expect(winProbability({ mate: 0 }, "w")).toBe(0);
  });
});

describe("parseInfoScore", () => {
  it("reads a centipawn score", () => {
    expect(parseInfoScore("info depth 12 seldepth 18 score cp -34 nodes 1000 pv e2e4")).toEqual({
      cp: -34,
    });
  });

  it("reads a mate score", () => {
    expect(parseInfoScore("info depth 9 score mate -2 pv h7h8")).toEqual({ mate: -2 });
  });

  it("ignores lines that carry no score", () => {
    expect(parseInfoScore("info string NNUE evaluation using nn-9067e33176e")).toBeNull();
    expect(parseInfoScore("info depth 1 currmove e2e4 currmovenumber 1")).toBeNull();
    expect(parseInfoScore("bestmove e2e4 ponder e7e5")).toBeNull();
  });
});
