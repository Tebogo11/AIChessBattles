import { useState } from "react";
import type { BotConfig } from "../game/botConfig";
import { PRESETS } from "../game/presets";

export interface SetupValues {
  first: BotConfig;
  second: BotConfig;
  randomizeColors: boolean;
}

interface SetupScreenProps {
  onStart: (values: SetupValues) => void;
  /** Disabled + label change while a match is being created. */
  starting?: boolean;
}

interface BotDraft {
  name: string;
  prompt: string;
}

const EMPTY: BotDraft = { name: "", prompt: "" };

/**
 * The setup screen from the wireframes: a name and a dominating prompt box per
 * bot, one-click presets, and a colour choice. Prompts are used directly as each
 * bot's instructions — the fallback path the persona design already allows
 * (SPEC §6, §9.1). Model selection arrives in a later ticket.
 */
export function SetupScreen({ onStart, starting }: SetupScreenProps) {
  const [first, setFirst] = useState<BotDraft>(EMPTY);
  const [second, setSecond] = useState<BotDraft>(EMPTY);
  const [randomizeColors, setRandomizeColors] = useState(true);

  const toConfig = (d: BotDraft, fallback: string): BotConfig => ({
    name: d.name.trim() || fallback,
    prompt: d.prompt.trim(),
    // Only the random mover exists so far; real providers are chosen here later.
    provider: "random",
    model: "",
  });

  const canStart = first.prompt.trim().length > 0 && second.prompt.trim().length > 0;

  const submit = () => {
    if (!canStart || starting) return;
    onStart({
      first: toConfig(first, "Bot A"),
      second: toConfig(second, "Bot B"),
      randomizeColors,
    });
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>AI Chess Battles</h1>
        <p className="app__tagline">
          Write a prompt for each bot, then start the match. A prompt can be a
          one-line strategy or a whole character.
        </p>
      </header>

      <div className="setup">
        <BotForm title="Bot A" draft={first} onChange={setFirst} />
        <div className="setup__vs" aria-hidden="true">
          VS
        </div>
        <BotForm title="Bot B" draft={second} onChange={setSecond} />
      </div>

      <div className="setup__footer">
        <label className="setup__toggle">
          <input
            type="checkbox"
            checked={randomizeColors}
            onChange={(e) => setRandomizeColors(e.target.checked)}
          />
          Randomise colours
        </label>
        <button
          type="button"
          className="setup__start"
          onClick={submit}
          disabled={!canStart || starting}
        >
          {starting ? "Starting…" : "Start match"}
        </button>
      </div>
      {!canStart ? (
        <p className="setup__hint">Give each bot a prompt to start — try a preset.</p>
      ) : null}
    </div>
  );
}

function BotForm({
  title,
  draft,
  onChange,
}: {
  title: string;
  draft: BotDraft;
  onChange: (d: BotDraft) => void;
}) {
  return (
    <section className="botform" aria-label={title}>
      <input
        className="botform__name"
        type="text"
        placeholder={`${title} name`}
        value={draft.name}
        onChange={(e) => onChange({ ...draft, name: e.target.value })}
      />
      <textarea
        className="botform__prompt"
        placeholder="How should this bot play? e.g. “Play aggressively and attack the king.”"
        value={draft.prompt}
        rows={7}
        onChange={(e) => onChange({ ...draft, prompt: e.target.value })}
      />
      <div className="botform__presets">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="chip"
            onClick={() => onChange({ name: draft.name || p.name, prompt: p.prompt })}
            title={p.prompt}
          >
            {p.label}
          </button>
        ))}
      </div>
    </section>
  );
}
