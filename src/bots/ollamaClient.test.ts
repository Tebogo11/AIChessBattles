import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderError } from "./chatClient";
import { listOllamaModels, OllamaChatClient } from "./ollamaClient";

function streamResponse(chunks: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      for (const c of chunks) controller.enqueue(enc.encode(c));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

async function drain(it: AsyncIterable<string>): Promise<string> {
  let out = "";
  for await (const d of it) out += d;
  return out;
}

afterEach(() => vi.restoreAllMocks());

describe("OllamaChatClient", () => {
  it("concatenates content deltas from newline-delimited JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        streamResponse([
          '{"message":{"content":"Hel"},"done":false}\n',
          '{"message":{"content":"lo"},"done":false}\n{"message":{"content":"!"},"done":true}\n',
        ]),
      ),
    );
    const client = new OllamaChatClient("llama3.2");
    expect(await drain(client.stream([{ role: "user", content: "hi" }]))).toBe("Hello!");
  });

  it("handles an object split across two network chunks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        streamResponse(['{"message":{"content":"ab', 'c"},"done":true}\n']),
      ),
    );
    const client = new OllamaChatClient("llama3.2");
    expect(await drain(client.stream([{ role: "user", content: "hi" }]))).toBe("abc");
  });

  it("surfaces a connection failure as a ProviderError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const client = new OllamaChatClient("llama3.2");
    await expect(drain(client.stream([{ role: "user", content: "hi" }]))).rejects.toBeInstanceOf(
      ProviderError,
    );
  });

  it("lists pulled models from /api/tags", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ models: [{ name: "llama3.2" }, { name: "qwen2.5" }] }), {
          status: 200,
        }),
      ),
    );
    expect(await listOllamaModels()).toEqual(["llama3.2", "qwen2.5"]);
  });
});
