import { useEffect, useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import type { EvalEngine } from "../analysis/evalEngine";
import type { BotConfig } from "../game/botConfig";
import { capturesAfter, materialAdvantage } from "../game/captures";
import { MAX_FULL_MOVES } from "../game/engine";
import type { Side } from "../game/types";
import { TERMINATION_LABEL } from "../game/types";
import type { Match } from "../game/useMatch";
import { useScrub } from "../game/useScrub";
import { BotCard } from "./BotCard";
import { ReasoningBlock } from "./ReasoningBlock";
import { ResultCard } from "./ResultCard";
import { SpeechLog } from "./SpeechLog";

interface MatchScreenProps {
  match: Match;
  whiteName: string;
  blackName: string;
  /** Provider, model and prompt for the bot cards, when the caller has them. */
  whiteConfig?: BotConfig;
  blackConfig?: BotConfig;
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
  /** Injected analysis engine factory; tests pass a fake. */
  createEngine?: () => EvalEngine;
}

/**
 * The match view: bot cards left, board centre, conversation right, reasoning
 * below. Every column is a fixed pixel width and every growing region — the
 * reasoning lanes, the speech log — scrolls inside a box of predetermined
 * height, so a bot streaming a long thought cannot move the board under the
 * cursor (#15).
 */
export function MatchScreen({
  match,
  whiteName,
  blackName,
  whiteConfig,
  blackConfig,
  subtitle,
  onNewGame,
  shareUrl,
  onRematch,
  onEditPrompts,
  autoplayReplay,
  createEngine,
}: MatchScreenProps) {
  const { plies, runState, result, fen, toMove } = match;
  const fullMove = Math.floor(plies.length / 2) + 1;
  const scrub = useScrub(plies, fen);
  // On a phone the cards live behind a tap; both bots in one sheet (SPEC §9.2).
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Captures are derived from the log at the position being viewed, so the row
  // always agrees with the board — live or scrubbed, fresh or shared.
  const captures = useMemo(() => capturesAfter(plies, scrub.viewingPly), [plies, scrub.viewingPly]);
  const advantage = materialAdvantage(captures);
  const stumbles = (side: Side) => plies.filter((p) => p.side === side && p.stumble).length;

  // Landing-page replay: walk a finished match from the start on a timer,
  // reusing the same board, cards and speech log a live match uses (SPEC §10).
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

  const cards = (
    <>
      <BotCard
        name={whiteName}
        side="w"
        config={whiteConfig}
        active={toMove === "w"}
        thinking={match.streaming?.side === "w"}
        captures={captures.w}
        advantage={advantage?.side === "w" ? advantage.points : null}
        stumbles={stumbles("w")}
      />
      <BotCard
        name={blackName}
        side="b"
        config={blackConfig}
        active={toMove === "b"}
        thinking={match.streaming?.side === "b"}
        captures={captures.b}
        advantage={advantage?.side === "b" ? advantage.points : null}
        stumbles={stumbles("b")}
      />
    </>
  );

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
        <div className="col col--bots">{cards}</div>

        <div className="col col--board">
          <div className="mobile-thoughts">
            <button type="button" onClick={() => setDetailsOpen(true)}>
              Bot details
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
            <button
              type="button"
              onClick={scrub.first}
              disabled={plies.length === 0}
              title="First position"
            >
              ⏮
            </button>
            <button
              type="button"
              onClick={scrub.back}
              disabled={plies.length === 0}
              title="Back one ply"
            >
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

          {result && !scrub.scrubbing ? (
            <ResultCard
              result={result}
              plies={plies}
              whiteName={whiteName}
              blackName={blackName}
              shareUrl={shareUrl}
              onRematch={onRematch}
              onEditPrompts={onEditPrompts}
              createEngine={createEngine}
            />
          ) : null}
        </div>

        <div className="col col--talk">
          <SpeechLog
            plies={plies}
            whiteName={whiteName}
            blackName={blackName}
            cutoff={scrub.viewedIndex}
            streaming={match.streaming}
          />
        </div>
      </main>

      <ReasoningBlock
        plies={plies}
        whiteName={whiteName}
        blackName={blackName}
        streaming={match.streaming}
        viewedIndex={scrub.viewedIndex}
      />

      {detailsOpen ? (
        <div className="drawer" role="dialog" aria-label="Bot details">
          <button
            type="button"
            className="drawer__scrim"
            aria-label="Close"
            onClick={() => setDetailsOpen(false)}
          />
          <div className="drawer__sheet">
            <button type="button" className="drawer__close" onClick={() => setDetailsOpen(false)}>
              Close ✕
            </button>
            {cards}
          </div>
        </div>
      ) : null}
    </div>
  );
}
