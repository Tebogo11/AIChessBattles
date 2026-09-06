import { Chessboard } from "react-chessboard";
import type { ChessBot } from "../bots/types";
import { MAX_FULL_MOVES } from "../game/engine";
import { useMatch } from "../game/useMatch";
import { TERMINATION_LABEL } from "../game/types";
import type { Side } from "../game/types";
import { BotPanel } from "./BotPanel";

interface MatchScreenProps {
  bots: Record<Side, ChessBot>;
}

export function MatchScreen({ bots }: MatchScreenProps) {
  const match = useMatch({ bots });
  const { plies, runState, result, fen, toMove, thinking } = match;
  const fullMove = Math.floor(plies.length / 2) + 1;

  return (
    <div className="app">
      <header className="app__header">
        <h1>AI Chess Battles</h1>
        <p className="app__tagline">Skeleton — two random movers, no AI yet.</p>
      </header>

      <main className="board-layout">
        <BotPanel
          name={bots.w.name}
          side="w"
          plies={plies}
          active={toMove === "w"}
          thinking={thinking}
        />

        <div className="board-column">
          <div className="board">
            <Chessboard
              options={{
                position: fen,
                allowDragging: false,
                animationDurationInMs: 200,
                id: "match-board",
              }}
            />
          </div>

          <div className="statusbar" role="status">
            {result ? (
              <strong>
                {TERMINATION_LABEL[result.reason]}
                {result.winner ? ` — ${result.winner === "w" ? "White" : "Black"} wins` : ""}
              </strong>
            ) : (
              <span>
                Move {fullMove} of {MAX_FULL_MOVES} · {toMove === "w" ? "White" : "Black"} to play
              </span>
            )}
          </div>

          <div className="transport">
            <button
              type="button"
              onClick={runState === "running" ? match.pause : match.play}
              disabled={runState === "finished"}
            >
              {runState === "running" ? "⏸ Pause" : "▷ Play"}
            </button>
            <button
              type="button"
              onClick={match.step}
              disabled={runState === "running" || runState === "finished"}
            >
              → Step
            </button>
            <button type="button" onClick={match.reset} disabled={plies.length === 0}>
              ↺ New game
            </button>
          </div>

          <section className="speech-log" aria-label="Match talk">
            <h2>Match talk</h2>
            <p className="speech-log__empty">
              Bots start talking once a real model is playing.
            </p>
          </section>
        </div>

        <BotPanel
          name={bots.b.name}
          side="b"
          plies={plies}
          active={toMove === "b"}
          thinking={thinking}
        />
      </main>
    </div>
  );
}
