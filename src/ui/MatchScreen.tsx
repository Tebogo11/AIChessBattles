import { Chessboard } from "react-chessboard";
import { MAX_FULL_MOVES } from "../game/engine";
import { TERMINATION_LABEL } from "../game/types";
import type { Match } from "../game/useMatch";
import { useScrub } from "../game/useScrub";
import { BotPanel } from "./BotPanel";
import { ResultCard } from "./ResultCard";
import { SpeechLog } from "./SpeechLog";

interface MatchScreenProps {
  match: Match;
  whiteName: string;
  blackName: string;
  /** Shown under the header; used to flag local-only mode. */
  subtitle?: string;
  /** "New game" action. Local mode resets; persisted mode navigates. */
  onNewGame?: () => void;
  /** A URL that opens this finished match for someone else (persisted only). */
  shareUrl?: string;
  /** Rematch with identical config. */
  onRematch?: () => void;
  /** Return to setup pre-filled with what was used. */
  onEditPrompts?: () => void;
}

export function MatchScreen({
  match,
  whiteName,
  blackName,
  subtitle,
  onNewGame,
  shareUrl,
  onRematch,
  onEditPrompts,
}: MatchScreenProps) {
  const { plies, runState, result, fen, toMove } = match;
  const fullMove = Math.floor(plies.length / 2) + 1;
  const scrub = useScrub(plies, fen);

  return (
    <div className="app">
      <header className="app__header">
        <h1>AI Chess Battles</h1>
        {subtitle ? <p className="app__tagline">{subtitle}</p> : null}
      </header>

      {match.error ? (
        <div className="error-banner" role="alert">
          <div>
            <strong>The match stalled.</strong>
            <p className="error-banner__text">{match.error}</p>
          </div>
          <button type="button" onClick={match.play}>
            Retry
          </button>
        </div>
      ) : null}

      <main className="board-layout">
        <BotPanel
          name={whiteName}
          side="w"
          plies={plies}
          active={toMove === "w"}
          streaming={match.streaming}
          viewedIndex={scrub.viewedIndex}
        />

        <div className="board-column">
          <div className="board">
            <Chessboard
              options={{
                position: scrub.fen,
                allowDragging: false,
                animationDurationInMs: 200,
                id: "match-board",
              }}
            />
          </div>

          {result && !scrub.scrubbing ? (
            <ResultCard
              result={result}
              plies={plies}
              whiteName={whiteName}
              blackName={blackName}
              shareUrl={shareUrl}
              onRematch={onRematch}
              onEditPrompts={onEditPrompts}
            />
          ) : null}

          <div className="statusbar" role="status">
            {scrub.scrubbing ? (
              <span>
                Reviewing ply {scrub.viewingPly} of {scrub.totalPlies} —{" "}
                <button type="button" className="linkbtn" onClick={scrub.live}>
                  back to live
                </button>
              </span>
            ) : result ? (
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

          <div className="transport transport--scrub">
            <button type="button" onClick={scrub.first} disabled={plies.length === 0} title="First position">
              ⏮
            </button>
            <button type="button" onClick={scrub.back} disabled={plies.length === 0} title="Back one ply">
              ←
            </button>
            <button
              type="button"
              onClick={scrub.forward}
              disabled={!scrub.scrubbing}
              title="Forward one ply"
            >
              →
            </button>
            <button
              type="button"
              onClick={scrub.live}
              disabled={!scrub.scrubbing}
              title="Return to the live game"
            >
              ⏭ Live
            </button>
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
            {onNewGame ? (
              <button type="button" onClick={onNewGame}>
                ↺ New game
              </button>
            ) : null}
          </div>

          <SpeechLog
            plies={plies}
            whiteName={whiteName}
            blackName={blackName}
            cutoff={scrub.viewedIndex}
            streaming={match.streaming}
          />
        </div>

        <BotPanel
          name={blackName}
          side="b"
          plies={plies}
          active={toMove === "b"}
          streaming={match.streaming}
          viewedIndex={scrub.viewedIndex}
        />
      </main>
    </div>
  );
}
