import type { EvalEngine } from "./evalEngine";
import { parseInfoScore, type EngineScore } from "./winProbability";

/**
 * Served from `public/`, copied out of the `stockfish` package by
 * `scripts/copy-stockfish.mjs`. This is the **single-threaded lite** build on
 * purpose: the multi-threaded one needs `SharedArrayBuffer`, which needs
 * COOP/COEP headers, which would make the whole site cross-origin isolated for
 * the sake of one optional chart (#15).
 */
const ENGINE_URL = "/stockfish/stockfish-18-lite-single.js";

/**
 * Stockfish behind the {@link EvalEngine} seam. The worker keeps the WASM off
 * the main thread, so the board stays scrubbable while a game is analysed.
 * Requests are serialised — UCI is a single-conversation protocol and a second
 * `go` before the first `bestmove` would interleave two searches.
 */
export class StockfishEngine implements EvalEngine {
  private worker: Worker | null = null;
  private booting: Promise<Worker> | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private disposed = false;

  private boot(): Promise<Worker> {
    if (this.booting) return this.booting;
    this.booting = new Promise<Worker>((resolve, reject) => {
      let worker: Worker;
      try {
        worker = new Worker(ENGINE_URL);
      } catch (err) {
        reject(new Error(`Could not start the analysis engine: ${String(err)}`));
        return;
      }
      this.worker = worker;
      const onMessage = (event: MessageEvent) => {
        const line = String(event.data ?? "");
        if (line.startsWith("uciok")) worker.postMessage("isready");
        else if (line.startsWith("readyok")) {
          worker.removeEventListener("message", onMessage);
          resolve(worker);
        }
      };
      worker.addEventListener("message", onMessage);
      worker.addEventListener("error", () =>
        reject(new Error("The analysis engine failed to load.")),
      );
      worker.postMessage("uci");
    });
    return this.booting;
  }

  evaluate(fen: string, depth: number, signal?: AbortSignal): Promise<EngineScore | null> {
    // Chain onto whatever is in flight, succeeded or not, so one failed
    // position doesn't wedge the rest of the game.
    const run = this.queue.then(
      () => this.search(fen, depth, signal),
      () => this.search(fen, depth, signal),
    );
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async search(
    fen: string,
    depth: number,
    signal?: AbortSignal,
  ): Promise<EngineScore | null> {
    if (this.disposed) return null;
    if (signal?.aborted) throw abortError();
    const worker = await this.boot();

    return new Promise<EngineScore | null>((resolve, reject) => {
      // Stockfish emits one info line per depth iteration; the last scored one
      // is the deepest and is the one that counts.
      let deepest: EngineScore | null = null;

      const cleanup = () => {
        worker.removeEventListener("message", onMessage);
        signal?.removeEventListener("abort", onAbort);
      };
      const onMessage = (event: MessageEvent) => {
        const line = String(event.data ?? "");
        if (line.startsWith("info")) {
          const score = parseInfoScore(line);
          if (score) deepest = score;
        } else if (line.startsWith("bestmove")) {
          cleanup();
          resolve(deepest);
        }
      };
      const onAbort = () => {
        worker.postMessage("stop");
        cleanup();
        reject(abortError());
      };

      worker.addEventListener("message", onMessage);
      signal?.addEventListener("abort", onAbort, { once: true });
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${depth}`);
    });
  }

  dispose(): void {
    this.disposed = true;
    this.worker?.terminate();
    this.worker = null;
    this.booting = null;
  }
}

function abortError(): Error {
  return typeof DOMException === "function"
    ? new DOMException("Analysis cancelled", "AbortError")
    : Object.assign(new Error("Analysis cancelled"), { name: "AbortError" });
}
