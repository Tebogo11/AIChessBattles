import { useMemo } from "react";
import { createRandomBot } from "./bots/randomBot";
import type { Side } from "./game/types";
import type { ChessBot } from "./bots/types";
import { MatchScreen } from "./ui/MatchScreen";

export function App() {
  // Milestone 1: two random movers. Real models arrive behind this same
  // interface, so nothing above here changes when they do.
  const bots = useMemo<Record<Side, ChessBot>>(
    () => ({ w: createRandomBot("White (random)"), b: createRandomBot("Black (random)") }),
    [],
  );

  return <MatchScreen bots={bots} />;
}
