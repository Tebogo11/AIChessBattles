import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { RANDOM_MATCHUP } from "../game/botConfig";

/**
 * Landing action for the persisted app: create a match and redirect to its URL.
 * Milestone 1 starts a random-vs-random match; the setup screen (ticket #5)
 * replaces this with real config.
 */
export function NewMatchRoute() {
  const create = useMutation(api.matches.create);
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void create({ white: RANDOM_MATCHUP.white, black: RANDOM_MATCHUP.black }).then((id) =>
      navigate(`/match/${id}`, { replace: true }),
    );
  }, [create, navigate]);

  return (
    <div className="app">
      <p>Starting a new match…</p>
    </div>
  );
}
