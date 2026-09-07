import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StockfishEngine } from "./stockfishEngine";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * A scripted stand-in for the Stockfish worker: it speaks UCI back but runs no
 * engine, so the protocol handling can be tested without loading 7MB of WASM.
 */
class FakeWorker extends EventTarget {
  static created: FakeWorker[] = [];
  /** Lines every `go` replies with. Empty means the search never finishes. */
  static script: string[] = [];

  posted: string[] = [];
  terminated = false;

  constructor(_url: string) {
    super();
    FakeWorker.created.push(this);
  }

  postMessage(message: string) {
    this.posted.push(message);
    if (message === "uci") this.emit("uciok");
    else if (message === "isready") this.emit("readyok");
    else if (message.startsWith("go")) for (const line of FakeWorker.script) this.emit(line);
  }

  emit(data: string) {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }

  terminate() {
    this.terminated = true;
  }
}

const latest = () => FakeWorker.created[FakeWorker.created.length - 1];
/** Let the engine's internal queue and boot handshake settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("StockfishEngine", () => {
  let original: unknown;

  beforeEach(() => {
    FakeWorker.created = [];
    FakeWorker.script = [];
    original = (globalThis as Record<string, unknown>).Worker;
    (globalThis as Record<string, unknown>).Worker = FakeWorker;
  });

  afterEach(() => {
    (globalThis as Record<string, unknown>).Worker = original;
  });

  it("handshakes, then asks for the position at the requested depth", async () => {
    FakeWorker.script = ["info depth 12 score cp 21", "bestmove e2e4"];
    const engine = new StockfishEngine();
    await engine.evaluate(START, 12);

    expect(latest().posted.slice(0, 2)).toEqual(["uci", "isready"]);
    expect(latest().posted).toContain(`position fen ${START}`);
    expect(latest().posted).toContain("go depth 12");
    engine.dispose();
  });

  it("takes the deepest info line, not the first", async () => {
    FakeWorker.script = [
      "info depth 1 score cp 500",
      "info depth 6 score cp 120",
      "info depth 12 score cp 21",
      "bestmove e2e4",
    ];
    const engine = new StockfishEngine();
    expect(await engine.evaluate(START, 12)).toEqual({ cp: 21 });
    engine.dispose();
  });

  it("ignores info lines that carry no score", async () => {
    FakeWorker.script = [
      "info depth 12 score mate 4",
      "info string NNUE evaluation using nn-9067e33176e",
      "info depth 12 currmove e2e4 currmovenumber 1",
      "bestmove e2e4",
    ];
    const engine = new StockfishEngine();
    expect(await engine.evaluate(START, 12)).toEqual({ mate: 4 });
    engine.dispose();
  });

  it("resolves null when the engine reports no score at all", async () => {
    FakeWorker.script = ["bestmove (none)"];
    const engine = new StockfishEngine();
    expect(await engine.evaluate(START, 12)).toBeNull();
    engine.dispose();
  });

  it("reuses one worker across positions", async () => {
    FakeWorker.script = ["info depth 12 score cp 0", "bestmove e2e4"];
    const engine = new StockfishEngine();
    await engine.evaluate(START, 12);
    await engine.evaluate(START, 12);
    expect(FakeWorker.created).toHaveLength(1);
    engine.dispose();
  });

  it("tells the engine to stop when the caller aborts, and rejects", async () => {
    FakeWorker.script = []; // the search never returns a bestmove
    const engine = new StockfishEngine();
    const controller = new AbortController();
    const pending = engine.evaluate(START, 12, controller.signal);
    await settle();
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(latest().posted).toContain("stop");
    engine.dispose();
  });

  it("releases the worker on dispose", async () => {
    FakeWorker.script = ["info depth 12 score cp 0", "bestmove e2e4"];
    const engine = new StockfishEngine();
    await engine.evaluate(START, 12);

    const worker = latest();
    engine.dispose();
    engine.dispose(); // twice is safe
    expect(worker.terminated).toBe(true);
  });
});
