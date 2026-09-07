/**
 * Yield the JSON payload of each `data:` line from a Server-Sent Events stream.
 * OpenAI and Gemini both stream this way. A terminal `[DONE]` sentinel ends the
 * stream. Incomplete trailing lines are buffered across network chunks.
 */
export async function* sseData(body: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const lines = pending.split("\n");
    pending = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice("data:".length).trim();
      if (payload === "[DONE]") return;
      if (payload) yield payload;
    }
  }
  const last = pending.trim();
  if (last.startsWith("data:")) {
    const payload = last.slice("data:".length).trim();
    if (payload && payload !== "[DONE]") yield payload;
  }
}
