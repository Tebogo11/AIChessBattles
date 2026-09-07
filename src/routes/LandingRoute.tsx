import { useQuery } from "convex/react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { usePersistedMatch } from "../game/usePersistedMatch";
import { MatchScreen } from "../ui/MatchScreen";

/**
 * The front door. An employer arrives with no key and no Ollama; instead of a
 * key prompt, a finished seeded match replays itself immediately. "Run your own"
 * is the secondary action. Hosting was never the demo problem; this is
 * (SPEC §10).
 */
export function LandingRoute() {
  const seeded = useQuery(api.matches.listSeeded, {});
  const navigate = useNavigate();

  // No seeds yet (fresh deployment) → send straight to setup.
  if (seeded !== undefined && seeded.length === 0) {
    return (
      <div className="app">
        <header className="app__header">
          <h1>AI Chess Battles</h1>
          <p className="app__tagline">Two LLM personas play chess. Write a prompt for each.</p>
        </header>
        <button type="button" className="setup__start" onClick={() => void navigate("/new")}>
          Run your own match
        </button>
      </div>
    );
  }

  if (seeded === undefined) {
    return (
      <div className="app">
        <p>Loading…</p>
      </div>
    );
  }

  const featured = seeded[0];
  return (
    <Replay id={featured._id} gallery={seeded} onRunYourOwn={() => void navigate("/new")} />
  );
}

function Replay({
  id,
  gallery,
  onRunYourOwn,
}: {
  id: Id<"matches">;
  gallery: { _id: Id<"matches">; white: { name: string; persona?: { name: string } }; black: { name: string; persona?: { name: string } } }[];
  onRunYourOwn: () => void;
}) {
  const { view, doc } = usePersistedMatch(id);
  const nameOf = (b: { name: string; persona?: { name: string } }) => b.persona?.name || b.name;

  return (
    <>
      <div className="landing-bar">
        <span>Watching a sample match — no key needed.</span>
        <button type="button" className="setup__start" onClick={onRunYourOwn}>
          Run your own
        </button>
      </div>

      {view && doc ? (
        <MatchScreen
          match={view}
          whiteName={nameOf(doc.white)}
          blackName={nameOf(doc.black)}
          autoplayReplay
          onRematch={onRunYourOwn}
        />
      ) : (
        <div className="app">
          <p>Loading replay…</p>
        </div>
      )}

      {gallery.length > 1 ? (
        <div className="app">
          <h2 className="gallery__title">More sample matches</h2>
          <ul className="gallery">
            {gallery.map((m) => (
              <li key={m._id}>
                <Link to={`/match/${m._id}`}>
                  {nameOf(m.white)} vs {nameOf(m.black)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
