import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import type { BotConfig } from "./botConfig";
import { buildBotContext } from "./buildContext";
import type { Ply, Side } from "./types";

const cfg = (over: Partial<BotConfig>): BotConfig => ({
  name: "Bot",
  prompt: "play",
  provider: "random",
  model: "",
  ...over,
});

const ply = (over: Partial<Ply>): Ply => ({
  index: 0,
  side: "w",
  san: "e4",
  fenAfter: "",
  thinking: "",
  speech: "",
  stumble: false,
  durationMs: 0,
  ...over,
});

describe("buildBotContext", () => {
  const configs: Record<Side, BotConfig> = {
    w: cfg({ name: "White", prompt: "white raw" }),
    b: cfg({ name: "Black", prompt: "black raw" }),
  };

  const plies = [
    ply({ index: 0, side: "w", thinking: "white secret A", speech: "hello" }),
    ply({ index: 1, side: "b", thinking: "black secret B", speech: "hi back" }),
  ];

  it("provably excludes the opponent's reasoning", () => {
    const game = new Chess();
    game.move("e4");
    game.move("e5");
    const ctx = buildBotContext("w", game, plies, configs);
    const blob = JSON.stringify(ctx);
    expect(ctx.ownRecentReasoning).toContain("white secret A");
    expect(blob).not.toContain("black secret B"); // opponent reasoning never present
  });

  it("includes the full speech log from both sides", () => {
    const game = new Chess();
    game.move("e4");
    game.move("e5");
    const ctx = buildBotContext("w", game, plies, configs);
    const texts = ctx.speechLog.map((s) => s.text);
    expect(texts).toEqual(["hello", "hi back"]);
  });

  it("uses the persona system prompt when present, else the raw prompt", () => {
    const withPersona: Record<Side, BotConfig> = {
      w: cfg({
        prompt: "raw",
        persona: {
          name: "P",
          traits: [],
          openingPreference: "",
          riskTolerance: "",
          speechRegister: "",
          catchphrases: [],
          systemPrompt: "PERSONA PROMPT",
        },
      }),
      b: cfg({ prompt: "black raw" }),
    };
    const game = new Chess();
    expect(buildBotContext("w", game, [], withPersona).systemPrompt).toBe("PERSONA PROMPT");
    expect(buildBotContext("b", game, [], withPersona).systemPrompt).toBe("black raw");
  });
});
