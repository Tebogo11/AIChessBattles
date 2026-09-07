import { describe, expect, it } from "vitest";
import type { ChatClient } from "./chatClient";
import { ProviderError } from "./chatClient";
import { renderPersonaPrompt, synthesizePersona } from "./synthesizePersona";

const clientReturning = (reply: string): ChatClient => ({
  async *stream() {
    yield reply;
  },
});

describe("synthesizePersona", () => {
  it("parses a tagged profile into a structured persona", async () => {
    const persona = await synthesizePersona(
      clientReturning(
        "<name>Li Mu</name><traits>calm, calculating, several moves ahead</traits>" +
          "<opening>solid, flexible</opening><risk>low, patient</risk>" +
          "<register>quiet authority</register><catchphrases>The board is a battlefield.</catchphrases>",
      ),
      "play like Li Mu from Kingdom",
    );
    expect(persona).not.toBeNull();
    expect(persona!.name).toBe("Li Mu");
    expect(persona!.traits).toEqual(["calm", "calculating", "several moves ahead"]);
    expect(persona!.catchphrases).toEqual(["The board is a battlefield."]);
    // The rendered prompt is what the bot runs on and mentions the name.
    expect(persona!.systemPrompt).toContain("Li Mu");
  });

  it("falls back to null when no name comes back (unknown subject)", async () => {
    expect(await synthesizePersona(clientReturning("I don't know who that is."), "???")).toBeNull();
  });

  it("falls back to null on a provider failure rather than throwing", async () => {
    const failing: ChatClient = {
      // eslint-disable-next-line require-yield
      async *stream() {
        throw new ProviderError("down", "test");
      },
    };
    expect(await synthesizePersona(failing, "anything")).toBeNull();
  });
});

describe("renderPersonaPrompt", () => {
  it("keeps the bot in character in thinking and speech", () => {
    const prompt = renderPersonaPrompt({
      name: "Berserker",
      traits: ["aggressive"],
      openingPreference: "gambits",
      riskTolerance: "high",
      speechRegister: "loud",
      catchphrases: ["Attack!"],
    });
    expect(prompt).toContain("Berserker");
    expect(prompt).toMatch(/in character/i);
  });
});
