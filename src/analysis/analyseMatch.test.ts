import { describe, expect, it, vi } from "vitest";
import type { Ply, Side } from "../game/types";
import { analyseMatch, sideToMoveOf, type EvalPoint } from "./analyseMatch";
import type { EvalEngine } from "./evalEngine";
import type { EngineScore } from "./winProbability";

const log = (sans: string[]): Ply[] =>
  sans.map((san, index) => ({
    index,
    side: (index % 2 === 0 ? "w" : "b") as Side,
    san,
    fenAfter: "",
    thinking: "",
    speech: "",
    stumble: false,
    durationMs: 0,
  }));

/**
 * A scripted engine standing in for Stockfish, in the manner of the fake chat
 * clients in providerClients.test.ts. No test here starts a real worker.
 */
function fakeEngine(scores: (EngineScore | null)[]): EvalEngine & { seen: string[] } {
  const seen: string[] = [];
  let call = 0;
  return {
    seen,
    async evaluate(fen: string) {
      seen.push(fen);
      const next = call < scores.length ? scores[call] : { cp: 0 };
      call += 1;
      return next;
    },
    dispose: vi.fn(),
  };
}

describe("sideToMoveOf", () => {
  it("reads the side to move off the FEN", () => {
    expect(sideToMoveOf("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")).toBe("w");
    expect(sideToMoveOf("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1")).toBe("b");
  });
});

describe("analyseMatch", () => {
  it("emits one point per position, starting with the opening position", async () => {
    const plies = log(["e4", "e5", "Nf3"]);
    const points = await analyseMatch({ plies, engine: fakeEngine([]), depth: 4 });
    expect(points.map((p) => p.ply)).toEqual([0, 1, 2, 3]);
  });

  it("evaluates positions in ply order", async () => {
    const engine = fakeEngine([]);
    await analyseMatch({ plies: log(["e4", "e5"]), engine, depth: 4 });
    expect(engine.seen).toHaveLength(3);
    expect(engine.seen[0]).toMatch(/ w /); // start position, White to move
    expect(engine.seen[1]).toMatch(/ b /); // after 1. e4, Black to move
    expect(engine.seen[2]).toMatch(/ w /);
  });

  it("normalises every point to White's perspective", async () => {
    // The same +300 reported on Black's turn must read as Black being better.
    const engine = fakeEngine([{ cp: 0 }, { cp: 300 }, { cp: 300 }]);
    const points = await analyseMatch({ plies: log(["e4", "e5"]), engine, depth: 4 });
    expect(points[0].winPct).toBeCloseTo(50, 6);
    expect(points[1].winPct).toBeLessThan(50); // Black to move and better
    expect(points[2].winPct).toBeGreaterThan(50); // White to move and better
  });

  it("reports points as they resolve rather than only at the end", async () => {
    const seenSoFar: EvalPoint[][] = [];
    const points: EvalPoint[] = [];
    await analyseMatch({
      plies: log(["e4", "e5"]),
      engine: fakeEngine([]),
      depth: 4,
      onPoint: (point, done, total) => {
        points.push(point);
        seenSoFar.push([...points]);
        expect(done).toBe(points.length);
        expect(total).toBe(3);
      },
    });
    expect(seenSoFar.map((s) => s.length)).toEqual([1, 2, 3]);
  });

  it("carries the previous point forward when a position has no score", async () => {
    // A mated position produces no score; the line should not gain a hole.
    const engine = fakeEngine([{ cp: 800 }, null]);
    const points = await analyseMatch({ plies: log(["e4"]), engine, depth: 4 });
    expect(points[1].winPct).toBe(points[0].winPct);
  });

  it("stops when the caller aborts", async () => {
    const controller = new AbortController();
    const engine: EvalEngine = {
      async evaluate() {
        controller.abort();
        return { cp: 0 };
      },
      dispose: vi.fn(),
    };
    const points = await analyseMatch({
      plies: log(["e4", "e5", "Nf3"]),
      engine,
      signal: controller.signal,
    });
    expect(points).toHaveLength(0);
  });

  it("stops at a move that will not replay instead of throwing", async () => {
    const points = await analyseMatch({ plies: log(["e4", "Qh8"]), engine: fakeEngine([]) });
    expect(points.map((p) => p.ply)).toEqual([0, 1]);
  });
});
