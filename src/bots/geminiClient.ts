import { ProviderError, type ChatClient } from "./chatClient";
import { createModelBot } from "./modelBot";
import type { ChatMessage } from "./promptAssembly";
import { sseData } from "./sse";
import type { ChessBot } from "./types";

/** Curated starting list; a free-text override handles anything newer (SPEC §9.1). */
export const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro"];

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Streams from Google's Gemini API. Gemini splits the system prompt into a
 * `systemInstruction` and uses roles user/model, so messages are mapped
 * accordingly. The key goes straight from the browser to Google (SPEC §9.3).
 */
export class GeminiChatClient implements ChatClient {
  constructor(
    private readonly model: string,
    private readonly apiKey: string | null,
  ) {}

  async *stream(messages: ChatMessage[], signal?: AbortSignal): AsyncIterable<string> {
    if (!this.apiKey) {
      throw new ProviderError(
        "No Gemini API key is set in this browser. Add one in the match setup.",
        "gemini",
      );
    }

    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const url = `${BASE}/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
    const body = {
      contents,
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
    } catch (err) {
      throw new ProviderError(`Could not reach Gemini: ${String(err)}`, "gemini");
    }

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      throw new ProviderError(`Gemini ${res.status}: ${detail || res.statusText}`.trim(), "gemini");
    }

    for await (const payload of sseData(res.body)) {
      let delta = "";
      try {
        const obj = JSON.parse(payload) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        delta = obj.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      } catch {
        delta = "";
      }
      if (delta) yield delta;
    }
  }
}

export function createGeminiBot(name: string, model: string, apiKey: string | null): ChessBot {
  return createModelBot(name, new GeminiChatClient(model, apiKey));
}
