import { useMutation } from "convex/react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { BotConfig } from "../game/botConfig";
import { usePersistedMatch } from "../game/usePersistedMatch";
import { MatchScreen } from "../ui/MatchScreen";

/** The stored nested bot config matches BotConfig exactly (no system fields). */
const toConfig = (b: Doc<"matches">["white"]): BotConfig => b;
const displayName = (b: Doc<"matches">["white"]) => b.persona?.name || b.name;

export function PersistedMatchRoute() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const create = useMutation(api.matches.create);
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

  const white = toConfig(doc.white);
  const black = toConfig(doc.black);

  const rematch = async () => {
    // Same personas, models and settings; a fresh game (SPEC §9.4).
    const newId = await create({ white, black });
    void navigate(`/match/${newId}`);
  };

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
        whiteName={displayName(doc.white)}
        blackName={displayName(doc.black)}
        onNewGame={() => void navigate("/")}
        shareUrl={typeof window !== "undefined" ? window.location.href : undefined}
        onRematch={() => void rematch()}
        onEditPrompts={() => void navigate("/", { state: { editConfigs: { white, black } } })}
      />
    </>
  );
}
