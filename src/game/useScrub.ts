import { useCallback, useMemo, useState } from "react";
import { START_FEN } from "./engine";
import { isScrubbing, normalize, stepBack, stepForward } from "./scrubCursor";
import type { Ply } from "./types";

export interface Scrub {
  /** True when viewing an earlier position rather than the live game. */
  scrubbing: boolean;
  /** FEN to display: the live fen when at the edge, else a past position. */
  fen: string;
  /** 1-based ply being viewed, and the total, for a "3 / 40" caption. */
  viewingPly: number;
  totalPlies: number;
  /** 0-based index of the ply being reviewed, or null when following live. */
  viewedIndex: number | null;
  first: () => void;
  back: () => void;
  forward: () => void;
  /** Snap back to the live game. */
  live: () => void;
}

/**
 * A view cursor over the append-only ply log. Moving it never truncates the
 * match or re-decides a move — it only changes what the board shows (SPEC §5).
 * Because it reads the same log for a live match and a finished replay, one
 * component serves both.
 */
export function useScrub(plies: Ply[], liveFen: string): Scrub {
  // null = follow the live edge. Otherwise a ply index being viewed.
  const [cursor, setCursor] = useState<number | null>(null);
  const total = plies.length;
  const effective = normalize(cursor, total);

  const fen = useMemo(() => {
    if (effective === null) return liveFen;
    if (effective < 0) return START_FEN;
    return plies[effective].fenAfter;
  }, [effective, liveFen, plies]);

  const back = useCallback(() => setCursor((c) => stepBack(c, total)), [total]);
  const forward = useCallback(() => setCursor((c) => stepForward(c, total)), [total]);
  const first = useCallback(() => setCursor(-1), []);
  const live = useCallback(() => setCursor(null), []);

  return {
    scrubbing: isScrubbing(cursor, total),
    fen,
    viewingPly: effective === null ? total : effective + 1,
    totalPlies: total,
    viewedIndex: effective !== null && effective >= 0 ? effective : null,
    first,
    back,
    forward,
    live,
  };
}
