import type { Doc } from "../../convex/_generated/dataModel";
import type { Ply } from "./types";

/** Project a stored ply row onto the in-memory shape the UI renders. */
export function toPly(row: Doc<"plies">): Ply {
  return {
    index: row.index,
    side: row.side,
    san: row.san,
    fenAfter: row.fenAfter,
    thinking: row.thinking,
    speech: row.speech,
    stumble: row.stumble,
    durationMs: row.durationMs,
  };
}
