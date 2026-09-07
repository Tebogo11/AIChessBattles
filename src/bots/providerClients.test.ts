import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderError } from "./chatClient";
import { GeminiChatClient } from "./geminiClient";
import { OpenAIChatClient } from "./openaiClient";

function sse(chunks: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      const enc = new TextEncoder();
      for (const ch of chunks) c.enqueue(enc.encode(ch));
      c.close();
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

describe("OpenAIChatClient", () => {
  it("refuses without a key, before any network call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const client = new OpenAIChatClient("gpt-4o-mini", null);
    await expect(drain(client.stream([{ role: "user", content: "hi" }]))).rejects.toBeInstanceOf(
      ProviderError,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("concatenates delta content from SSE", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        sse([
          'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
          'data: {"choices":[{"delta":{"content":"lo"}}]}\n\ndata: [DONE]\n\n',
        ]),
      ),
    );
    const client = new OpenAIChatClient("gpt-4o-mini", "sk-test");
    expect(await drain(client.stream([{ role: "user", content: "hi" }]))).toBe("Hello");
  });

  it("surfaces the verbatim error body on a bad request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("model not found", { status: 404 })),
    );
    const client = new OpenAIChatClient("bogus", "sk-test");
    await expect(drain(client.stream([{ role: "user", content: "hi" }]))).rejects.toThrow(
      /model not found/,
    );
  });

  it("sends the key as a bearer token to OpenAI, straight from the browser", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(sse(["data: [DONE]\n\n"]));
    vi.stubGlobal("fetch", fetchSpy);
    await drain(new OpenAIChatClient("gpt-4o-mini", "sk-secret").stream([{ role: "user", content: "hi" }]));
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain("api.openai.com");
    expect(init.headers.Authorization).toBe("Bearer sk-secret");
  });
});

describe("GeminiChatClient", () => {
  it("maps roles and streams text parts", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      sse([
        'data: {"candidates":[{"content":{"parts":[{"text":"Che"}]}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":"ck."}]}}]}\n\n',
      ]),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const client = new GeminiChatClient("gemini-2.0-flash", "g-key");
    const out = await drain(
      client.stream([
        { role: "system", content: "be terse" },
        { role: "user", content: "move" },
        { role: "assistant", content: "prior" },
      ]),
    );
    expect(out).toBe("Check.");
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.systemInstruction.parts[0].text).toBe("be terse");
    expect(body.contents.map((c: { role: string }) => c.role)).toEqual(["user", "model"]);
  });

  it("refuses without a key", async () => {
    const client = new GeminiChatClient("gemini-2.0-flash", null);
    await expect(drain(client.stream([{ role: "user", content: "hi" }]))).rejects.toBeInstanceOf(
      ProviderError,
    );
  });
});
