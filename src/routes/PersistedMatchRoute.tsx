import { useQuery } from "convex/react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { usePersistedMatch } from "../game/usePersistedMatch";
import { MatchScreen } from "../ui/MatchScreen";

export function PersistedMatchRoute() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const id = matchId as Id<"matches">;

  const doc = useQuery(api.matches.get, { matchId: id });
  const match = usePersistedMatch(id);

  if (doc === null) {
    return (
      <div className="app">
        <p>No match found for this link.</p>
      </div>
    );
  }
  if (!match || !doc) {
    return (
      <div className="app">
        <p>Loading match…</p>
      </div>
    );
  }

  return (
    <MatchScreen
      match={match}
      whiteName={doc.white.name}
      blackName={doc.black.name}
      onNewGame={() => void navigate("/")}
    />
  );
}
