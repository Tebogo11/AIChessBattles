import { describe, expect, it } from "vitest";
import { capturesAfter, describeCaptures, materialAdvantage, materialTaken } from "./captures";
import type { Ply, Side } from "./types";

/** A ply log from a SAN list; only side and san matter to capture derivation. */
const log = (sans: string[]): Ply[] =>
  sans.map((san, index) => ({
    index,
    side: (index % 2 === 0 ? "w" : "b") as Side,
    san,
    fenAfter: "",
    thinking: "",
    speech: "",
    stumble: false,
    durationMs: 0,
  }));

describe("capturesAfter", () => {
  it("credits each capture to the side that made it", () => {
    // 1. e4 d5 2. exd5 Qxd5
    const captures = capturesAfter(log(["e4", "d5", "exd5", "Qxd5"]), 4);
    expect(captures.w).toEqual(["p"]);
    expect(captures.b).toEqual(["p"]);
  });

  it("counts an en-passant capture and a capture-promotion", () => {
    // 3. exf6 is en passant; 5. fxg8=Q takes the knight and promotes.
    const sans = ["e4", "d5", "e5", "f5", "exf6", "Nc6", "f7+", "Kd7", "fxg8=Q"];
    const captures = capturesAfter(log(sans), sans.length);
    expect(captures.w).toEqual(["n", "p"]); // most valuable first
    expect(captures.b).toEqual([]);
  });

  it("reflects the position being scrubbed to, not the whole game", () => {
    const plies = log(["e4", "d5", "exd5", "Qxd5"]);
    expect(capturesAfter(plies, 0)).toEqual({ w: [], b: [] });
    expect(capturesAfter(plies, 3)).toEqual({ w: ["p"], b: [] });
    expect(capturesAfter(plies, 4)).toEqual({ w: ["p"], b: ["p"] });
  });

  it("orders a mixed haul most valuable first", () => {
    // 1. d4 e5 2. dxe5 d6 3. exd6 Bxd6 4. e4 Bxh2 5. Rxh2
    const sans = ["d4", "e5", "dxe5", "d6", "exd6", "Bxd6", "e4", "Bxh2", "Rxh2"];
    const captures = capturesAfter(log(sans), sans.length);
    expect(captures.w).toEqual(["b", "p", "p"]);
    expect(captures.b).toEqual(["p", "p"]);
  });

  it("stops at a move that will not replay rather than throwing", () => {
    const captures = capturesAfter(log(["e4", "Qh8"]), 2);
    expect(captures).toEqual({ w: [], b: [] });
  });
});

describe("material", () => {
  it("adds up standard piece values", () => {
    expect(materialTaken(["q", "r", "p"])).toBe(15);
    expect(materialTaken([])).toBe(0);
  });

  it("reports who leads and by how much", () => {
    expect(materialAdvantage({ w: ["r"], b: ["n"] })).toEqual({ side: "w", points: 2 });
    expect(materialAdvantage({ w: ["p"], b: ["q"] })).toEqual({ side: "b", points: 8 });
  });

  it("reports nobody when the exchange is level", () => {
    expect(materialAdvantage({ w: ["n"], b: ["b"] })).toBeNull();
    expect(materialAdvantage({ w: [], b: [] })).toBeNull();
  });
});

describe("describeCaptures", () => {
  it("pluralises and joins for a screen reader", () => {
    expect(describeCaptures([])).toBe("nothing yet");
    expect(describeCaptures(["q"])).toBe("a queen");
    expect(describeCaptures(["q", "p", "p"])).toBe("a queen and 2 pawns");
    expect(describeCaptures(["r", "n", "p"])).toBe("a rook, a knight and a pawn");
  });
});
