import type { Ply, Side } from "../game/types";

interface BotPanelProps {
  name: string;
  side: Side;
  plies: Ply[];
  active: boolean;
  thinking: boolean;
}

/**
 * Where a bot's private reasoning will stream. Until a model is wired up there
 * is nothing to think, so it shows the moves that bot has actually played.
 */
export function BotPanel({ name, side, plies, active, thinking }: BotPanelProps) {
  const own = plies.filter((p) => p.side === side);
  const stumbles = own.filter((p) => p.stumble).length;

  return (
    <section className={`panel${active ? " panel--active" : ""}`} aria-label={`${name} thoughts`}>
      <header className="panel__header">
        <span className={`dot dot--${side}`} aria-hidden="true" />
        <h2>{name}</h2>
        {active && thinking ? <span className="panel__status">thinking…</span> : null}
      </header>

      {stumbles > 0 ? (
        <p className="panel__stumbles">
          {stumbles} stumble{stumbles === 1 ? "" : "s"}
        </p>
      ) : null}

      <ol className="panel__moves" reversed>
        {[...own].reverse().map((ply) => (
          <li key={ply.index}>
            <span className="panel__movenum">{Math.floor(ply.index / 2) + 1}.</span>
            <span className="panel__san">{ply.san}</span>
            {ply.thinking ? <p className="panel__thinking">{ply.thinking}</p> : null}
          </li>
        ))}
      </ol>

      {own.length === 0 ? <p className="panel__empty">No moves yet.</p> : null}
    </section>
  );
}
