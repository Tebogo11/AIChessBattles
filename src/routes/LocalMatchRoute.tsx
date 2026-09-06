import { useMemo, useState } from "react";
import { assignColors } from "../game/assignColors";
import type { BotConfig } from "../game/botConfig";
import type { Side } from "../game/types";
import { useMatch } from "../game/useMatch";
import { MatchScreen } from "../ui/MatchScreen";
import { SetupScreen, type SetupValues } from "../ui/SetupScreen";

/**
 * Convex isn't configured (VITE_CONVEX_URL blank), so the whole setup → match
 * flow runs in memory and a refresh loses it — ticket #1 behaviour. Set
 * VITE_CONVEX_URL for persistence and shareable URLs.
 */
export function LocalMatchRoute() {
  const [matchup, setMatchup] = useState<{ white: BotConfig; black: BotConfig } | null>(null);

  if (!matchup) {
    return (
      <SetupScreen
        onStart={(values: SetupValues) =>
          setMatchup(assignColors(values.first, values.second, values.randomizeColors))
        }
      />
    );
  }

  return <LocalMatch matchup={matchup} onNewGame={() => setMatchup(null)} />;
}

function LocalMatch({
  matchup,
  onNewGame,
}: {
  matchup: { white: BotConfig; black: BotConfig };
  onNewGame: () => void;
}) {
  const configs = useMemo<Record<Side, BotConfig>>(
    () => ({ w: matchup.white, b: matchup.black }),
    [matchup],
  );
  const match = useMatch({ configs });

  return (
    <MatchScreen
      match={match}
      whiteName={matchup.white.name}
      blackName={matchup.black.name}
      subtitle="Local-only mode — set VITE_CONVEX_URL to persist matches and get shareable links."
      onNewGame={onNewGame}
    />
  );
}
