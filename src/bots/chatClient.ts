import type { ChatMessage } from "./promptAssembly";

/**
 * A streaming chat backend. Every provider (Ollama, OpenAI, Gemini) implements
 * this one interface, so the decide/retry/fallback loop in {@link createModelBot}
 * is written once and shared (SPEC §3, §11).
 */
export interface ChatClient {
  /** Yields content deltas as they arrive. Concatenated, they are the reply. */
  stream(messages: ChatMessage[], signal?: AbortSignal): AsyncIterable<string>;
}

/** Raised so the UI can show a provider's verbatim error, not a generic one (SPEC §8). */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly provider: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
