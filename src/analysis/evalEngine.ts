import type { EngineScore } from "./winProbability";

/**
 * The seam between the analysis driver and Stockfish, mirroring how
 * `ChatClient` abstracts the model providers: the real implementation wraps a
 * Web Worker, and tests inject a fake so no suite ever starts an engine.
 */
export interface EvalEngine {
  /**
   * Evaluate one position to a fixed depth. Resolves with the deepest score the
   * engine reported, or null if it produced none.
   */
  evaluate(fen: string, depth: number, signal?: AbortSignal): Promise<EngineScore | null>;
  /** Release the underlying worker. Safe to call twice. */
  dispose(): void;
}

/**
 * The low end of the useful range. The difference from depth 14 is invisible at
 * chart resolution while the runtime is materially shorter, and this analysis
 * runs in the viewer's own tab (#15).
 */
export const DEFAULT_DEPTH = 12;
