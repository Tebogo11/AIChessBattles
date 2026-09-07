import { describe, expect, it, vi } from "vitest";
import type { ChatClient } from "./chatClient";
import { createModelBot, MAX_ATTEMPTS, PROVIDER_ATTEMPTS } from "./modelBot";
import { ProviderError } from "./chatClient";
import type { BotContext } from "./types";

const ctx: BotContext = {
  side: "w",
  systemPrompt: "Play well.",
  fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  history: [],
  legalMoves: ["e4", "d4", "Nf3", "c4"],
  ownRecentReasoning: [],
  speechLog: [],
};

/** A client that returns a scripted reply per call, streamed as two chunks. */
function scriptedClient(replies: string[]): ChatClient {
  let call = 0;
  return {
    async *stream() {
      const reply = replies[Math.min(call, replies.length - 1)];
      call++;
      const mid = Math.floor(reply.length / 2);
      yield reply.slice(0, mid);
      yield reply.slice(mid);
    },
  };
}

describe("createModelBot", () => {
  it("plays a valid tagged move on the first try", async () => {
    const client = scriptedClient([
      "<thinking>Control the centre.</thinking><speech>Let's go.</speech><move>e4</move>",
    ]);
    const bot = createModelBot("Tester", client);
    const decision = await bot.decide(ctx);
    expect(decision).toEqual({
      san: "e4",
      thinking: "Control the centre.",
      speech: "Let's go.",
      stumble: false,
    });
  });

  it("recovers on a later attempt after an illegal move", async () => {
    const client = scriptedClient([
      "<thinking>hmm</thinking><speech></speech><move>Ke2</move>", // illegal
      "<thinking>ok</thinking><speech></speech><move>Nf3</move>", // legal
    ]);
    const bot = createModelBot("Tester", client);
    const decision = await bot.decide(ctx);
    expect(decision.san).toBe("Nf3");
    expect(decision.stumble).toBe(false);
  });

  it("stumbles to a random legal move after all attempts fail", async () => {
    const client = scriptedClient([
      "<thinking>t</thinking><speech></speech><move>totally illegal</move>",
    ]);
    const bot = createModelBot("Tester", client);
    const decision = await bot.decide(ctx);
    expect(decision.stumble).toBe(true);
    expect(ctx.legalMoves).toContain(decision.san);
    // The last reasoning is preserved even on a stumble.
    expect(decision.thinking).toBe("t");
  });

  it("streams the growing buffer via onDelta", async () => {
    const client = scriptedClient([
      "<thinking>abc</thinking><speech></speech><move>e4</move>",
    ]);
    const bot = createModelBot("Tester", client);
    const onDelta = vi.fn();
    await bot.decide(ctx, { onDelta });
    expect(onDelta).toHaveBeenCalled();
    // Buffer only grows: the final call holds the whole reply.
    const last = onDelta.mock.calls.at(-1)![0] as string;
    expect(last).toContain("<move>e4</move>");
  });

  it("gives up after exactly MAX_ATTEMPTS", async () => {
    let calls = 0;
    const client: ChatClient = {
      async *stream() {
        calls++;
        yield "<thinking>x</thinking><speech></speech><move>nope</move>";
      },
    };
    await createModelBot("Tester", client).decide(ctx);
    expect(calls).toBe(MAX_ATTEMPTS);
  });
});

describe("provider error handling", () => {
  const failing = (times: number, then: string): ChatClient => {
    let calls = 0;
    return {
      async *stream() {
        calls++;
        if (calls <= times) throw new ProviderError("rate limited", "test");
        yield then;
      },
    };
  };

  it("retries a provider error with backoff, then succeeds", async () => {
    const client = failing(2, "<thinking>t</thinking><speech></speech><move>e4</move>");
    const sleep = vi.fn().mockResolvedValue(undefined);
    const bot = createModelBot("Tester", client, { backoffBaseMs: 10, sleep });
    const decision = await bot.decide(ctx);
    expect(decision.san).toBe("e4");
    // Two failures → two backoff waits, doubling.
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep.mock.calls[0][0]).toBe(10);
    expect(sleep.mock.calls[1][0]).toBe(20);
  });

  it("propagates the provider's verbatim error after all attempts fail", async () => {
    const client: ChatClient = {
      async *stream() {
        throw new ProviderError("invalid api key", "test");
      },
    };
    const sleep = vi.fn().mockResolvedValue(undefined);
    const bot = createModelBot("Tester", client, { backoffBaseMs: 1, sleep });
    await expect(bot.decide(ctx)).rejects.toThrow("invalid api key");
  });

  it("makes exactly PROVIDER_ATTEMPTS attempts before giving up", async () => {
    let calls = 0;
    const client: ChatClient = {
      async *stream() {
        calls++;
        throw new ProviderError("down", "test");
      },
    };
    const bot = createModelBot("Tester", client, { backoffBaseMs: 1, sleep: async () => {} });
    await expect(bot.decide(ctx)).rejects.toThrow();
    expect(calls).toBe(PROVIDER_ATTEMPTS);
  });
});
