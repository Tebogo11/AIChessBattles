import { useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import type { Side } from "../game/types";
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
  /** Auto-walk a finished match from the start — the landing-page replay (SPEC §10). */
  autoplayReplay?: boolean;
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
  autoplayReplay,
}: MatchScreenProps) {
  const { plies, runState, result, fen, toMove } = match;
  const fullMove = Math.floor(plies.length / 2) + 1;
  const scrub = useScrub(plies, fen);
  // On a phone the thoughts panels live behind a tap; one bot at a time (SPEC §9.2).
  const [openThoughts, setOpenThoughts] = useState<Side | null>(null);

  // Landing-page replay: walk a finished match from the start on a timer,
  // reusing the same board, panels and speech log a live match uses (SPEC §10).
  const { goTo } = scrub;
  useEffect(() => {
    if (!autoplayReplay || !result || plies.length === 0) return;
    let i = -1;
    goTo(-1);
    const id = setInterval(() => {
      i += 1;
      if (i >= plies.length - 1) {
        goTo(null);
        clearInterval(id);
      } else {
        goTo(i);
      }
    }, 1100);
    return () => clearInterval(id);
  }, [autoplayReplay, result, plies.length, goTo]);

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
        <div className="side-panel">
          <BotPanel
            name={whiteName}
            side="w"
            plies={plies}
            active={toMove === "w"}
            streaming={match.streaming}
            viewedIndex={scrub.viewedIndex}
          />
        </div>

        <div className="board-column">
          <div className="mobile-thoughts">
            <button type="button" onClick={() => setOpenThoughts("w")}>
              {whiteName}’s thoughts{match.streaming?.side === "w" ? " •" : ""}
            </button>
            <button type="button" onClick={() => setOpenThoughts("b")}>
              {blackName}’s thoughts{match.streaming?.side === "b" ? " •" : ""}
            </button>
          </div>

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

        <div className="side-panel">
          <BotPanel
            name={blackName}
            side="b"
            plies={plies}
            active={toMove === "b"}
            streaming={match.streaming}
            viewedIndex={scrub.viewedIndex}
          />
        </div>
      </main>

      {openThoughts ? (
        <div className="drawer" role="dialog" aria-label="Bot thoughts">
          <button
            type="button"
            className="drawer__scrim"
            aria-label="Close"
            onClick={() => setOpenThoughts(null)}
          />
          <div className="drawer__sheet">
            <button type="button" className="drawer__close" onClick={() => setOpenThoughts(null)}>
              Close ✕
            </button>
            <BotPanel
              name={openThoughts === "w" ? whiteName : blackName}
              side={openThoughts}
              plies={plies}
              active={toMove === openThoughts}
              streaming={match.streaming}
              viewedIndex={scrub.viewedIndex}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
