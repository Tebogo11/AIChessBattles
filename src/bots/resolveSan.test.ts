import { describe, expect, it } from "vitest";
import { randomLegalMove, resolveSan } from "./resolveSan";

const legal = ["e4", "Nf3", "O-O", "Qxd5+", "exd6"];

describe("resolveSan", () => {
  it("accepts a verbatim legal move", () => {
    expect(resolveSan("Nf3", legal)).toBe("Nf3");
  });

  it("strips a leading move number", () => {
    expect(resolveSan("12. Nf3", legal)).toBe("Nf3");
  });

  it("strips trailing punctuation", () => {
    expect(resolveSan("Nf3.", legal)).toBe("Nf3");
  });

  it("takes only the first token", () => {
    expect(resolveSan("Nf3 is best", legal)).toBe("Nf3");
  });

  it("matches case-insensitively", () => {
    expect(resolveSan("nf3", legal)).toBe("Nf3");
  });

  it("returns null for an illegal move", () => {
    expect(resolveSan("Ke2", legal)).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(resolveSan("", legal)).toBeNull();
  });
});

describe("randomLegalMove", () => {
  it("always returns a move from the list", () => {
    expect(legal).toContain(randomLegalMove(legal, () => 0));
    expect(legal).toContain(randomLegalMove(legal, () => 0.99));
  });
});
