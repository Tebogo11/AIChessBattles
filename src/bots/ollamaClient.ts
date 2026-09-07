import { ProviderError, type ChatClient } from "./chatClient";
import { createModelBot } from "./modelBot";
import type { ChatMessage } from "./promptAssembly";
import type { ChessBot } from "./types";

export const DEFAULT_OLLAMA_URL = "http://localhost:11434";

/**
 * Streams from a local Ollama server's /api/chat endpoint. Ollama emits
 * newline-delimited JSON objects, each carrying a `message.content` delta while
 * `done` is false (SPEC §2). Inference is client-side, so this runs in the
 * visitor's browser and talks straight to their Ollama.
 */
export class OllamaChatClient implements ChatClient {
  constructor(
    private readonly model: string,
    private readonly baseUrl: string = DEFAULT_OLLAMA_URL,
  ) {}

  async *stream(messages: ChatMessage[], signal?: AbortSignal): AsyncIterable<string> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, messages, stream: true }),
        signal,
      });
    } catch {
      // A browser reaching a visitor's local Ollama fails here without the right
      // CORS allowance. Give the exact fix rather than a generic network error
      // (SPEC §9.3). Safari is stricter than Chrome about such requests.
      const origin = typeof window !== "undefined" ? window.location.origin : "this page";
      throw new ProviderError(
        [
          `Could not reach Ollama at ${this.baseUrl}.`,
          `1. Is Ollama running? Start it with: ollama serve`,
          `2. Allow this page to talk to it by setting OLLAMA_ORIGINS to include ${origin}, then restart Ollama:`,
          `   (macOS)  launchctl setenv OLLAMA_ORIGINS "${origin}"`,
          `   (Linux)  OLLAMA_ORIGINS="${origin}" ollama serve`,
          `   (Windows) set OLLAMA_ORIGINS=${origin}  then restart Ollama`,
          `Safari is stricter than Chrome about this.`,
        ].join("\n"),
        "ollama",
      );
    }

    if (!res.ok || !res.body) {
      throw new ProviderError(
        `Ollama returned ${res.status} ${res.statusText}`.trim(),
        "ollama",
      );
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let pending = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });

      // Objects are newline-delimited; the last fragment may be incomplete.
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        yield contentOf(trimmed);
      }
    }
    if (pending.trim()) yield contentOf(pending.trim());
  }
}

function contentOf(line: string): string {
  try {
    const obj = JSON.parse(line) as { message?: { content?: string }; error?: string };
    if (obj.error) throw new ProviderError(obj.error, "ollama");
    return obj.message?.content ?? "";
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    return ""; // A malformed line is skipped rather than killing the stream.
  }
}

/** List the models the user has actually pulled, for the model picker (#11). */
export async function listOllamaModels(baseUrl: string = DEFAULT_OLLAMA_URL): Promise<string[]> {
  const res = await fetch(`${baseUrl}/api/tags`);
  if (!res.ok) throw new ProviderError(`Ollama returned ${res.status}`, "ollama");
  const data = (await res.json()) as { models?: { name: string }[] };
  return (data.models ?? []).map((m) => m.name);
}

export function createOllamaBot(name: string, model: string, baseUrl?: string): ChessBot {
  return createModelBot(name, new OllamaChatClient(model, baseUrl));
}
