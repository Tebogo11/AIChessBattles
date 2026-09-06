import { describe, expect, it } from "vitest";
import { isScrubbing, normalize, stepBack, stepForward } from "./scrubCursor";

// A match with 4 plies: live edge is index 3.
const TOTAL = 4;

describe("scrub cursor", () => {
  it("follows the live edge by default", () => {
    expect(normalize(null, TOTAL)).toBeNull();
    expect(isScrubbing(null, TOTAL)).toBe(false);
  });

  it("stepping back from live enters scrub at the previous ply", () => {
    const c = stepBack(null, TOTAL);
    expect(c).toBe(TOTAL - 2); // viewing ply index 2
    expect(isScrubbing(c, TOTAL)).toBe(true);
  });

  it("cannot step back past the start position", () => {
    let c: number | null = -1;
    c = stepBack(c, TOTAL);
    expect(c).toBe(-1);
  });

  it("stepping forward off the edge returns to live", () => {
    expect(stepForward(TOTAL - 2, TOTAL)).toBeNull();
  });

  it("stepping forward in the middle advances one ply", () => {
    expect(stepForward(0, TOTAL)).toBe(1);
  });

  it("a cursor at or past the live edge normalizes to live", () => {
    // New plies arrived; a cursor that was the edge is now stale → live.
    expect(normalize(3, TOTAL)).toBeNull();
    expect(normalize(2, TOTAL)).toBe(2);
  });

  it("forward is a no-op while already following live", () => {
    expect(stepForward(null, TOTAL)).toBeNull();
  });
});
