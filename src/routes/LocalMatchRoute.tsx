import { useMemo } from "react";
import { createRandomBot } from "../bots/randomBot";
import type { ChessBot } from "../bots/types";
import type { Side } from "../game/types";
import { useMatch } from "../game/useMatch";
import { MatchScreen } from "../ui/MatchScreen";

/**
 * Convex isn't configured (VITE_CONVEX_URL blank). The match plays entirely in
 * memory and a refresh loses it — ticket #1 behaviour. Set VITE_CONVEX_URL to
 * get persistence and shareable URLs.
 */
export function LocalMatchRoute() {
  const bots = useMemo<Record<Side, ChessBot>>(
    () => ({ w: createRandomBot("White (random)"), b: createRandomBot("Black (random)") }),
    [],
  );
  const match = useMatch({ bots });

  return (
    <MatchScreen
      match={match}
      whiteName={bots.w.name}
      blackName={bots.b.name}
      subtitle="Local-only mode — set VITE_CONVEX_URL to persist matches and get shareable links."
      onNewGame={match.reset}
    />
  );
}
