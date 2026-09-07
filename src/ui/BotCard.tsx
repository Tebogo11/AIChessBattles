import { useState } from "react";
import type { BotConfig } from "../game/botConfig";
import { captureGlyph, describeCaptures, type CapturedPiece } from "../game/captures";
import type { Side } from "../game/types";

interface BotCardProps {
  name: string;
  side: Side;
  /** Provider, model and the raw prompt, when the caller has the config. */
  config?: BotConfig;
  /** True when it is this bot's turn. */
  active: boolean;
  /** True while this bot is deciding. */
  thinking: boolean;
  /** What this bot has taken off the board, at the position being viewed. */
  captures: CapturedPiece[];
  /** Points this bot leads by, or null when it is not ahead. */
  advantage: number | null;
  stumbles: number;
}

const COLOUR_NAME: Record<Side, string> = { w: "White", b: "Black" };

/**
 * A bot's identity card: who it is, what is driving it, what it was told, and
 * what it has captured. Deliberately static — reasoning streams into the
 * reasoning block below the board instead, because a growing panel inside the
 * page grid reflows everything around it on every token (#15).
 */
export function BotCard({
  name,
  side,
  config,
  active,
  thinking,
  captures,
  advantage,
  stumbles,
}: BotCardProps) {
  const [expanded, setExpanded] = useState(false);
  const colour = COLOUR_NAME[side];
  const prompt = config?.prompt.trim() ?? "";

  return (
    <section
      className={`botcard${active ? " botcard--active" : ""}`}
      aria-label={`${name}, playing ${colour}`}
    >
      <header className="botcard__header">
        <span className={`botcard__badge botcard__badge--${side}`}>{colour}</span>
        <h2 className="botcard__name">{name}</h2>
        {thinking ? <span className="botcard__status">thinking…</span> : null}
      </header>

      {config ? (
        <p className="botcard__model">
          {config.provider === "random" ? "random mover" : `${config.provider} · ${config.model}`}
        </p>
      ) : null}

      {prompt ? (
        <div className="botcard__promptwrap">
          <p className={expanded ? "botcard__prompt" : "botcard__prompt botcard__prompt--clamped"}>
            {prompt}
          </p>
          <button type="button" className="linkbtn" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show less" : "Show full prompt"}
          </button>
        </div>
      ) : null}

      <div className="botcard__captures">
        <span className="botcard__caplabel">Captured</span>
        <span className="botcard__glyphs" aria-hidden="true">
          {captures.length === 0
            ? "—"
            : captures.map((piece, i) => (
                <span key={`${piece}-${i}`}>{captureGlyph(side, piece)}</span>
              ))}
        </span>
        <span className="visually-hidden">{`${name} has captured ${describeCaptures(captures)}`}</span>
        {advantage !== null ? (
          <span className="botcard__advantage" title="Material advantage">
            +{advantage}
          </span>
        ) : null}
      </div>

      {stumbles > 0 ? (
        <p className="botcard__stumbles">
          {stumbles} stumble{stumbles === 1 ? "" : "s"}
        </p>
      ) : null}
    </section>
  );
}
