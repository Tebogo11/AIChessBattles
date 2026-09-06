import { useNavigate, useParams } from "react-router-dom";
import type { Id } from "../../convex/_generated/dataModel";
import { usePersistedMatch } from "../game/usePersistedMatch";
import { MatchScreen } from "../ui/MatchScreen";

export function PersistedMatchRoute() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const id = matchId as Id<"matches">;

  const { view, doc, resumeNeeded, resume, loaded, notFound } = usePersistedMatch(id);

  if (loaded && notFound) {
    return (
      <div className="app">
        <p>No match found for this link.</p>
      </div>
    );
  }
  if (!view || !doc) {
    return (
      <div className="app">
        <p>Loading match…</p>
      </div>
    );
  }

  return (
    <>
      {resumeNeeded ? (
        <div className="resume-banner" role="alert">
          <span>This match was interrupted. Pick up where it left off?</span>
          <button type="button" onClick={resume}>
            Resume
          </button>
        </div>
      ) : null}
      <MatchScreen
        match={view}
        whiteName={doc.white.name}
        blackName={doc.black.name}
        onNewGame={() => void navigate("/")}
      />
    </>
  );
}
