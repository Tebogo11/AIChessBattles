import { describe, expect, it } from "vitest";
import { assignColors } from "./assignColors";
import type { BotConfig } from "./botConfig";
import { PRESETS } from "./presets";

const a: BotConfig = { name: "A", prompt: "pa", provider: "random", model: "" };
const b: BotConfig = { name: "B", prompt: "pb", provider: "random", model: "" };

describe("presets", () => {
  it("offers 5–6 presets spanning terse strategy to named characters", () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(5);
    expect(PRESETS.length).toBeLessThanOrEqual(6);
    expect(PRESETS.some((p) => /Li Mu/.test(p.label))).toBe(true);
    expect(PRESETS.some((p) => /champion/i.test(p.label))).toBe(true);
    for (const p of PRESETS) expect(p.prompt.length).toBeGreaterThan(20);
  });
});

describe("assignColors", () => {
  it("keeps the first bot as white when randomise is off", () => {
    expect(assignColors(a, b, false)).toEqual({ white: a, black: b });
  });

  it("swaps when randomise is on and the coin says so", () => {
    expect(assignColors(a, b, true, () => true)).toEqual({ white: b, black: a });
    expect(assignColors(a, b, true, () => false)).toEqual({ white: a, black: b });
  });
});
