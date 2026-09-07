import { useState } from "react";
import type { EvalEngine } from "../analysis/evalEngine";
import { reasoningMarkdown, type ExportInput } from "../game/exportMarkdown";
import { matchPgn } from "../game/exportPgn";
import { matchSlug } from "../game/moveLabel";
import { TERMINATION_LABEL } from "../game/types";
import type { MatchResult, Ply } from "../game/types";
import { downloadText } from "./download";
import { GameAnalysis } from "./GameAnalysis";

/** Where a downloaded PGN can be replayed, for people who have no chess app. */
const PGN_VIEWER_URL = "https://chesstempo.com/pgn-viewer/";

interface ResultCardProps {
  result: MatchResult;
  plies: Ply[];
  whiteName: string;
  blackName: string;
  /** A URL that opens this finished match for someone else, if persisted. */
  shareUrl?: string;
  /** Start a new match with identical config. */
  onRematch?: () => void;
  /** Return to setup pre-filled with what was used. */
  onEditPrompts?: () => void;
  /** Injected engine factory for the analysis; tests pass a fake. */
  createEngine?: () => EvalEngine;
}

/**
 * The card shown the moment a match ends (any termination, including the 150-
 * move cap). The stumble count per bot is the payoff of #8 — comparative model
 * data no other chess demo surfaces. Everything the user can take away lives
 * here too: the reasoning, the moves, and an engine reading of who was actually
 * winning (#15). Nothing auto-navigates; the user just watched a game end
 * (SPEC §9.4).
 */
export function ResultCard({
  result,
  plies,
  whiteName,
  blackName,
  shareUrl,
  onRematch,
  onEditPrompts,
  createEngine,
}: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const stumbles = (side: "w" | "b") => plies.filter((p) => p.side === side && p.stumble).length;

  const headline = result.winner
    ? `${result.winner === "w" ? whiteName : blackName} wins`
    : "Draw";

  const exportInput: ExportInput = { plies, whiteName, blackName, result };
  const slug = matchSlug(whiteName, blackName);

  const share = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="resultcard" role="dialog" aria-label="Match result">
      <h2 className="resultcard__headline">{headline}</h2>
      <p className="resultcard__reason">{TERMINATION_LABEL[result.reason]}</p>

      <dl className="resultcard__stats">
        <div>
          <dt>Moves</dt>
          <dd>{Math.ceil(plies.length / 2)}</dd>
        </div>
        <div>
          <dt>{whiteName} stumbles</dt>
          <dd>{stumbles("w")}</dd>
        </div>
        <div>
          <dt>{blackName} stumbles</dt>
          <dd>{stumbles("b")}</dd>
        </div>
      </dl>

      <div className="resultcard__actions">
        {onRematch ? (
          <button type="button" className="setup__start" onClick={onRematch}>
            Rematch same config
          </button>
        ) : null}
        {onEditPrompts ? (
          <button type="button" onClick={onEditPrompts}>
            Edit prompts
          </button>
        ) : null}
        {shareUrl ? (
          <button type="button" onClick={() => void share()}>
            {copied ? "Link copied!" : "Share"}
          </button>
        ) : null}
      </div>

      <div className="resultcard__downloads">
        <button
          type="button"
          onClick={() =>
            downloadText(`${slug}-reasoning.md`, reasoningMarkdown(exportInput), "text/markdown")
          }
        >
          ⬇ Download reasoning (.md)
        </button>
        <button
          type="button"
          onClick={() => downloadText(`${slug}.pgn`, matchPgn(exportInput), "application/x-chess-pgn")}
        >
          ⬇ Download PGN
        </button>
        <a
          className="resultcard__viewer"
          href={PGN_VIEWER_URL}
          target="_blank"
          rel="noreferrer noopener"
        >
          Replay it at chesstempo →
        </a>
      </div>
      <p className="resultcard__hint">
        Download the PGN first, then paste it into the chesstempo viewer to walk through the game.
      </p>

      <GameAnalysis
        plies={plies}
        whiteName={whiteName}
        blackName={blackName}
        createEngine={createEngine}
      />
    </div>
  );
}
