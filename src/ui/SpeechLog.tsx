import type { Ply, Side, StreamingState } from "../game/types";

interface SpeechLogProps {
  plies: Ply[];
  whiteName: string;
  blackName: string;
  /** Show speech only up to this ply index while scrubbing; null = live/all. */
  cutoff: number | null;
  /** The in-flight speech, shown as a pending line when live. */
  streaming: StreamingState | null;
}

/**
 * The shared conversation beneath the board: both bots' speech interleaved in
 * time order. A single log — not per-panel bubbles — is the only layout where a
 * taunt and its reply sit next to each other (SPEC §9.2). Empty speech is a bot
 * choosing silence and renders as nothing, never a blank line (SPEC §4.3).
 */
export function SpeechLog({ plies, whiteName, blackName, cutoff, streaming }: SpeechLogProps) {
  const nameFor = (side: Side) => (side === "w" ? whiteName : blackName);

  const entries = plies
    .filter((p) => (cutoff === null || p.index <= cutoff) && p.speech.trim().length > 0)
    .map((p) => ({ index: p.index, side: p.side, text: p.speech }));

  const pending =
    cutoff === null && streaming && streaming.speech.trim().length > 0
      ? { side: streaming.side, text: streaming.speech }
      : null;

  return (
    <section className="speech-log" aria-label="Match talk">
      <h2>Match talk</h2>
      {entries.length === 0 && !pending ? (
        <p className="speech-log__empty">No one has spoken yet.</p>
      ) : (
        <ul className="speech-log__list">
          {entries.map((e) => (
            <li key={e.index} className={`speech speech--${e.side}`}>
              <span className="speech__name">{nameFor(e.side)}</span>
              <span className="speech__text">{e.text}</span>
            </li>
          ))}
          {pending ? (
            <li className={`speech speech--${pending.side} speech--pending`}>
              <span className="speech__name">{nameFor(pending.side)}</span>
              <span className="speech__text">{pending.text}</span>
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}
