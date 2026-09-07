import { useMemo, useState } from "react";
import type { BotConfig } from "../game/botConfig";
import type { Side } from "../game/types";
import { useMatch } from "../game/useMatch";
import { MatchScreen } from "../ui/MatchScreen";
import { SetupFlow } from "../ui/SetupFlow";

type Matchup = { white: BotConfig; black: BotConfig };

/**
 * Convex isn't configured (VITE_CONVEX_URL blank), so the whole flow runs in
 * memory and a refresh loses it — ticket #1 behaviour. Set VITE_CONVEX_URL for
 * persistence and shareable URLs.
 */
export function LocalMatchRoute() {
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [initial, setInitial] = useState<{ first: BotConfig; second: BotConfig } | undefined>();

  if (!matchup) {
    return (
      <SetupFlow
        initial={initial}
        onConfirm={(white, black) => setMatchup({ white, black })}
      />
    );
  }
  return (
    <LocalMatch
      matchup={matchup}
      onEdit={() => {
        setInitial({ first: matchup.white, second: matchup.black });
        setMatchup(null);
      }}
      onNewGame={() => {
        setInitial(undefined);
        setMatchup(null);
      }}
    />
  );
}

function LocalMatch({
  matchup,
  onEdit,
  onNewGame,
}: {
  matchup: Matchup;
  onEdit: () => void;
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
      whiteName={matchup.white.persona?.name || matchup.white.name}
      blackName={matchup.black.persona?.name || matchup.black.name}
      whiteConfig={matchup.white}
      blackConfig={matchup.black}
      subtitle="Local-only mode — set VITE_CONVEX_URL to persist matches and get shareable links."
      onNewGame={onNewGame}
      onRematch={match.reset}
      onEditPrompts={onEdit}
    />
  );
}
