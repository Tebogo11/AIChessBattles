import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { analyseMatch, type EvalPoint } from "../analysis/analyseMatch";
import type { EvalEngine } from "../analysis/evalEngine";
import { StockfishEngine } from "../analysis/stockfishEngine";
import type { Ply } from "../game/types";

/**
 * The charting library is a big dependency and only a finished, deliberately
 * analysed match ever needs it. Loading it on demand keeps the landing-page
 * replay as cheap as it was (#15).
 */
const EvalChart = lazy(() =>
  import("./EvalChart").then((m) => ({ default: m.EvalChart })),
);

export interface GameAnalysisProps {
  plies: Ply[];
  whiteName: string;
  blackName: string;
  /** The seam: tests inject a fake so no suite ever starts a real worker. */
  createEngine?: () => EvalEngine;
}

type Status = "idle" | "running" | "done" | "error";

/**
 * Engine analysis of a finished game, run only when asked for. Nothing is
 * stored: the landing-page replay stays as cheap as it is today, at the cost of
 * each viewer recomputing (#15).
 */
export function GameAnalysis({ plies, whiteName, blackName, createEngine }: GameAnalysisProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [points, setPoints] = useState<EvalPoint[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const job = useRef<{ controller: AbortController; engine: EvalEngine } | null>(null);

  const stop = useCallback(() => {
    job.current?.controller.abort();
    job.current?.engine.dispose();
    job.current = null;
  }, []);

  // Leaving the page mid-analysis must not leave a worker chewing on a game
  // nobody is looking at.
  useEffect(() => stop, [stop]);

  const run = async () => {
    stop();
    const engine = (createEngine ?? (() => new StockfishEngine()))();
    const controller = new AbortController();
    job.current = { controller, engine };
    setStatus("running");
    setError(null);
    setPoints([]);
    setProgress({ done: 0, total: plies.length + 1 });

    try {
      await analyseMatch({
        plies,
        engine,
        signal: controller.signal,
        onPoint: (point, done, total) => {
          if (controller.signal.aborted) return;
          setPoints((prev) => [...prev, point]);
          setProgress({ done, total });
        },
      });
      if (!controller.signal.aborted) setStatus("done");
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    } finally {
      engine.dispose();
      if (job.current?.controller === controller) job.current = null;
    }
  };

  const stumbles = plies.filter((p) => p.stumble).map((p) => ({ index: p.index, side: p.side }));

  return (
    <section className="analysis" aria-label="Game analysis">
      {status === "idle" ? (
        <button type="button" onClick={() => void run()}>
          Analyse game
        </button>
      ) : null}

      {status === "running" ? (
        <div className="analysis__progress">
          <p role="status">
            Analysing… {progress.done} of {progress.total} positions
          </p>
          <progress value={progress.done} max={progress.total || 1} />
          <button
            type="button"
            onClick={() => {
              stop();
              setStatus(points.length > 1 ? "done" : "idle");
            }}
          >
            Stop
          </button>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="analysis__error">
          <p>Analysis failed: {error}</p>
          <button type="button" onClick={() => void run()}>
            Try again
          </button>
        </div>
      ) : null}

      {points.length > 1 ? (
        <Suspense fallback={<p className="analysis__caveat">Drawing the curve…</p>}>
          <EvalChart
            points={points}
            stumbles={stumbles}
            whiteName={whiteName}
            blackName={blackName}
          />
        </Suspense>
      ) : null}

      {status === "done" ? (
        <p className="analysis__caveat">
          Engine-objective advantage, not practical difficulty — a position the engine calls level
          can still be very hard to hold.
        </p>
      ) : null}
    </section>
  );
}
