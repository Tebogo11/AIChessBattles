import { ProviderError, type ChatClient } from "./chatClient";
import { createModelBot } from "./modelBot";
import type { ChatMessage } from "./promptAssembly";
import { sseData } from "./sse";
import type { ChessBot } from "./types";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/** Curated starting list; a free-text override handles anything newer (SPEC §9.1). */
export const OPENAI_MODELS = [
  "gpt-5",
  "gpt-5-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4o",
  "gpt-4o-mini",
  "o4-mini",
];

/**
 * Streams from OpenAI's chat completions API. The key is passed in from the
 * browser key store and sent straight to OpenAI — it never touches our backend
 * (SPEC §9.3). A bad model id surfaces OpenAI's verbatim error.
 */
export class OpenAIChatClient implements ChatClient {
  constructor(
    private readonly model: string,
    private readonly apiKey: string | null,
  ) {}

  async *stream(messages: ChatMessage[], signal?: AbortSignal): AsyncIterable<string> {
    if (!this.apiKey) {
      throw new ProviderError(
        "No OpenAI API key is set in this browser. Add one in the match setup.",
        "openai",
      );
    }

    let res: Response;
    try {
      res = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ model: this.model, messages, stream: true }),
        signal,
      });
    } catch (err) {
      throw new ProviderError(`Could not reach OpenAI: ${String(err)}`, "openai");
    }

    if (!res.ok || !res.body) {
      // Surface the provider's verbatim error text (SPEC §9.1).
      const detail = await res.text().catch(() => "");
      throw new ProviderError(`OpenAI ${res.status}: ${detail || res.statusText}`.trim(), "openai");
    }

    for await (const payload of sseData(res.body)) {
      let delta = "";
      try {
        const obj = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        delta = obj.choices?.[0]?.delta?.content ?? "";
      } catch {
        delta = "";
      }
      if (delta) yield delta;
    }
  }
}

export function createOpenAIBot(name: string, model: string, apiKey: string | null): ChessBot {
  return createModelBot(name, new OpenAIChatClient(model, apiKey));
}
