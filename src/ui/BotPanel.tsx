import type { Ply, Side, StreamingState } from "../game/types";

interface BotPanelProps {
  name: string;
  side: Side;
  plies: Ply[];
  active: boolean;
  /** The in-flight stream, if any bot is currently thinking. */
  streaming: StreamingState | null;
  /** Ply index currently being reviewed by the scrub cursor, or null if live. */
  viewedIndex: number | null;
}

/**
 * A bot's private reasoning. While this bot is thinking, the current reasoning
 * streams in word by word — the wait is the show, never a bare spinner
 * (SPEC §5). Otherwise it lists the bot's own moves with their stored
 * reasoning, and highlights the one being reviewed while scrubbing (#7).
 */
export function BotPanel({ name, side, plies, active, streaming, viewedIndex }: BotPanelProps) {
  const own = plies.filter((p) => p.side === side);
  const stumbles = own.filter((p) => p.stumble).length;
  const isStreaming = streaming?.side === side;

  return (
    <section className={`panel${active ? " panel--active" : ""}`} aria-label={`${name} thoughts`}>
      <header className="panel__header">
        <span className={`dot dot--${side}`} aria-hidden="true" />
        <h2>{name}</h2>
        {isStreaming ? <span className="panel__status">thinking…</span> : null}
      </header>

      {stumbles > 0 ? (
        <p className="panel__stumbles">
          {stumbles} stumble{stumbles === 1 ? "" : "s"}
        </p>
      ) : null}

      {isStreaming ? (
        <div className="panel__live">
          <p className="panel__thinking">
            {streaming!.thinking || <span className="panel__cursor">▌</span>}
          </p>
          {streaming!.speech ? <p className="panel__saying">“{streaming!.speech}”</p> : null}
        </div>
      ) : null}

      <ol className="panel__moves" reversed>
        {[...own].reverse().map((ply) => (
          <li
            key={ply.index}
            className={ply.index === viewedIndex ? "panel__move--viewed" : undefined}
          >
            <div className="panel__moveline">
              <span className="panel__movenum">{Math.floor(ply.index / 2) + 1}.</span>
              <span className="panel__san">{ply.san}</span>
              {ply.stumble ? <span className="panel__stumbletag">stumble</span> : null}
            </div>
            {ply.thinking ? <p className="panel__thinking">{ply.thinking}</p> : null}
          </li>
        ))}
      </ol>

      {own.length === 0 && !isStreaming ? <p className="panel__empty">No moves yet.</p> : null}
    </section>
  );
}
