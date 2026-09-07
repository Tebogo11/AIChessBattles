import { useEffect, useRef } from "react";
import { moveLabel } from "../game/moveLabel";
import type { Ply, Side, StreamingState } from "../game/types";

interface ReasoningBlockProps {
  plies: Ply[];
  whiteName: string;
  blackName: string;
  /** The in-flight stream, or null between moves. */
  streaming: StreamingState | null;
  /** Ply index under the scrub cursor, or null when following live. */
  viewedIndex: number | null;
}

/**
 * Every bit of reasoning in the match, live or historical, in one place below
 * the board: one lane per bot, side by side, so the same position can be read
 * from both points of view.
 *
 * The lanes have an explicit height and scroll internally. That is the whole
 * point of this component: a stream of unknown length cannot move anything
 * outside a box whose height was decided in advance (#15).
 */
export function ReasoningBlock({
  plies,
  whiteName,
  blackName,
  streaming,
  viewedIndex,
}: ReasoningBlockProps) {
  return (
    <section className="reasoning" aria-label="Reasoning">
      <ReasoningLane
        side="w"
        name={whiteName}
        plies={plies}
        streaming={streaming}
        viewedIndex={viewedIndex}
      />
      <ReasoningLane
        side="b"
        name={blackName}
        plies={plies}
        streaming={streaming}
        viewedIndex={viewedIndex}
      />
    </section>
  );
}

function ReasoningLane({
  side,
  name,
  plies,
  streaming,
  viewedIndex,
}: {
  side: Side;
  name: string;
  plies: Ply[];
  streaming: StreamingState | null;
  viewedIndex: number | null;
}) {
  const own = plies.filter((p) => p.side === side);
  const isStreaming = streaming?.side === side;
  const scroller = useRef<HTMLDivElement>(null);

  // Follow the newest text. Reading a stream while dragging a scrollbar is not
  // reading; the lane keeps itself pinned to the bottom instead.
  const streamedLength = isStreaming ? streaming!.thinking.length : 0;
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [own.length, streamedLength]);

  return (
    <div className={`lane lane--${side}`}>
      <header className="lane__header">
        <span className={`dot dot--${side}`} aria-hidden="true" />
        <h3 className="lane__title">
          {side === "w" ? "White" : "Black"} — {name}
        </h3>
        {isStreaming ? <span className="lane__status">thinking…</span> : null}
      </header>

      <div className="lane__scroll" ref={scroller} aria-label={`${name} reasoning`}>
        {own.length === 0 && !isStreaming ? (
          <p className="lane__empty">No reasoning yet.</p>
        ) : null}

        <ol className="lane__moves">
          {own.map((ply) => (
            <li
              key={ply.index}
              className={ply.index === viewedIndex ? "lane__move lane__move--viewed" : "lane__move"}
            >
              <div className="lane__moveline">
                <span className="lane__movenum">{moveLabel(ply.index)}</span>
                <span className="lane__san">{ply.san}</span>
                {ply.stumble ? <span className="lane__stumbletag">stumble</span> : null}
              </div>
              {ply.thinking ? <p className="lane__thinking">{ply.thinking}</p> : null}
            </li>
          ))}
        </ol>

        {isStreaming ? (
          <div className="lane__live">
            <p className="lane__thinking">
              {streaming!.thinking || <span className="lane__cursor">▌</span>}
            </p>
            {streaming!.speech ? <p className="lane__saying">“{streaming!.speech}”</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
