import { ProviderError, type ChatClient } from "./chatClient";
import { createModelBot } from "./modelBot";
import type { ChatMessage } from "./promptAssembly";
import { sseData } from "./sse";
import type { ChessBot } from "./types";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
/**
 * Cap the reply. The tagged sections are short, but on models where thinking is
 * on by default (Opus 5 and the rest of the 4.6+ family) the thinking tokens
 * count against this cap too — 1024 truncated the answer before <move> arrived.
 */
const MAX_TOKENS = 8192;

/** Curated starting list; a free-text override handles anything newer (SPEC §9.1). */
export const ANTHROPIC_MODELS = [
  "claude-opus-5",
  "claude-sonnet-5",
  "claude-opus-4-8",
  "claude-opus-4-7",
  "claude-opus-4-6",
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
  "claude-fable-5-1",
];

/**
 * Picking a move is a small task, so the lowest effort keeps latency and cost
 * down. `output_config` is ignored by the older models that don't take it, but
 * Sonnet 4.5 and earlier reject it, so it's only sent for the models that
 * support it.
 */
const NO_EFFORT_SUPPORT = /^claude-(haiku-4-5|sonnet-4-5|3)/;

/**
 * Streams from Anthropic's Messages API. Anthropic takes the system prompt as a
 * top-level `system` string (not a message) and only user/assistant roles, so
 * messages are mapped accordingly. Browser BYOK calls need the explicit
 * direct-browser-access header; the key goes straight from the browser to
 * Anthropic and never touches our backend (SPEC §9.3).
 */
export class AnthropicChatClient implements ChatClient {
  constructor(
    private readonly model: string,
    private readonly apiKey: string | null,
  ) {}

  async *stream(messages: ChatMessage[], signal?: AbortSignal): AsyncIterable<string> {
    if (!this.apiKey) {
      throw new ProviderError(
        "No Anthropic API key is set in this browser. Add one in the match setup.",
        "anthropic",
      );
    }

    const system = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    const anthropicMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    let res: Response;
    try {
      res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
          // Required for calls made directly from a browser.
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: MAX_TOKENS,
          ...(NO_EFFORT_SUPPORT.test(this.model)
            ? {}
            : { output_config: { effort: "low" } }),
          ...(system ? { system } : {}),
          messages: anthropicMessages,
          stream: true,
        }),
        signal,
      });
    } catch (err) {
      throw new ProviderError(`Could not reach Anthropic: ${String(err)}`, "anthropic");
    }

    if (!res.ok || !res.body) {
      // Surface the provider's verbatim error text (SPEC §9.1).
      const detail = await res.text().catch(() => "");
      throw new ProviderError(
        `Anthropic ${res.status}: ${detail || res.statusText}`.trim(),
        "anthropic",
      );
    }

    for await (const payload of sseData(res.body)) {
      let delta = "";
      try {
        const obj = JSON.parse(payload) as {
          type?: string;
          delta?: { type?: string; text?: string };
        };
        // Text arrives as content_block_delta events; other event types
        // (message_start, ping, message_stop, …) carry no text.
        if (obj.type === "content_block_delta" && obj.delta?.type === "text_delta") {
          delta = obj.delta.text ?? "";
        }
      } catch {
        delta = "";
      }
      if (delta) yield delta;
    }
  }
}

export function createAnthropicBot(name: string, model: string, apiKey: string | null): ChessBot {
  return createModelBot(name, new AnthropicChatClient(model, apiKey));
}
