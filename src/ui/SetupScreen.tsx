import { useState } from "react";
import { providerNeedsKey, type KeyedProvider } from "../bots/keyStore";
import type { BotConfig, Provider } from "../game/botConfig";
import { PRESETS } from "../game/presets";
import { KeyInput } from "./KeyInput";
import { ModelPicker } from "./ModelPicker";

export interface SetupValues {
  first: BotConfig;
  second: BotConfig;
  randomizeColors: boolean;
}

interface SetupScreenProps {
  onStart: (values: SetupValues) => void;
  /** Disabled + label change while a match is being created. */
  starting?: boolean;
  /** Pre-fill the two forms, e.g. from "Edit prompts" (SPEC §9.4). */
  initial?: { first: BotConfig; second: BotConfig };
}

interface BotDraft {
  name: string;
  prompt: string;
  provider: Provider;
  model: string;
}

const EMPTY: BotDraft = { name: "", prompt: "", provider: "random", model: "" };

const toDraft = (c: BotConfig): BotDraft => ({
  name: c.name,
  prompt: c.prompt,
  provider: c.provider,
  model: c.model,
});

/**
 * The setup screen from the wireframes: a name and a dominating prompt box per
 * bot, one-click presets, a per-bot model picker, and a colour choice. Any
 * provider can face any other (SPEC §11). API keys are requested only when a
 * keyed provider is selected, and once per provider (SPEC §9.1).
 *
 * The first form plays White and the second plays Black, and the headings say
 * so. Randomising is opt-in rather than the default, because a label that is
 * only true half the time is worse than no label at all (#15).
 */
export function SetupScreen({ onStart, starting, initial }: SetupScreenProps) {
  const [first, setFirst] = useState<BotDraft>(initial ? toDraft(initial.first) : EMPTY);
  const [second, setSecond] = useState<BotDraft>(initial ? toDraft(initial.second) : EMPTY);
  const [randomizeColors, setRandomizeColors] = useState(false);

  const toConfig = (d: BotDraft, fallback: string): BotConfig => ({
    name: d.name.trim() || fallback,
    prompt: d.prompt.trim(),
    provider: d.provider,
    model: d.model.trim(),
  });

  const promptsReady = first.prompt.trim().length > 0 && second.prompt.trim().length > 0;
  const modelReady = (d: BotDraft) => d.provider === "random" || d.model.trim().length > 0;
  const canStart = promptsReady && modelReady(first) && modelReady(second);

  // Distinct keyed providers currently selected — a key is asked once each.
  const keyedProviders = Array.from(
    new Set([first.provider, second.provider].filter(providerNeedsKey)),
  ) as KeyedProvider[];

  const submit = () => {
    if (!canStart || starting) return;
    onStart({
      first: toConfig(first, "Bot A"),
      second: toConfig(second, "Bot B"),
      randomizeColors,
    });
  };

  const labels = randomizeColors
    ? {
        first: { title: "Bot A", hint: "Colour drawn at random", placeholder: "Bot A name" },
        second: { title: "Bot B", hint: "Colour drawn at random", placeholder: "Bot B name" },
      }
    : {
        first: { title: "White", hint: "This bot plays White and moves first", placeholder: "White bot name" },
        second: { title: "Black", hint: "This bot plays Black", placeholder: "Black bot name" },
      };

  return (
    <div className="app">
      <header className="app__header">
        <h1>AI Chess Battles</h1>
        <p className="app__tagline">
          Write a prompt for each bot, pick a model, then start the match. A
          prompt can be a one-line strategy or a whole character.
        </p>
      </header>

      <p className="setup__colours">
        {randomizeColors
          ? "Colours will be drawn at random when the match starts."
          : "The first bot plays White, the second plays Black."}
      </p>

      <div className="setup">
        <BotForm labels={labels.first} side="w" draft={first} onChange={setFirst} />
        <div className="setup__vs" aria-hidden="true">
          VS
        </div>
        <BotForm labels={labels.second} side="b" draft={second} onChange={setSecond} />
      </div>

      {keyedProviders.length > 0 ? (
        <div className="setup__keys">
          {keyedProviders.map((p) => (
            <KeyInput key={p} provider={p} />
          ))}
        </div>
      ) : null}

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
        <p className="setup__hint">
          {promptsReady
            ? "Choose a model for each bot to start."
            : "Give each bot a prompt to start — try a preset."}
        </p>
      ) : null}
    </div>
  );
}

function BotForm({
  labels,
  side,
  draft,
  onChange,
}: {
  labels: { title: string; hint: string; placeholder: string };
  /** Only drives the colour dot; randomised matches still show the form order. */
  side: "w" | "b";
  draft: BotDraft;
  onChange: (d: BotDraft) => void;
}) {
  return (
    <section className="botform" aria-label={labels.title}>
      <header className="botform__header">
        <span className={`dot dot--${side}`} aria-hidden="true" />
        <h2 className="botform__title">{labels.title}</h2>
        <span className="botform__hint">{labels.hint}</span>
      </header>
      <input
        className="botform__name"
        type="text"
        placeholder={labels.placeholder}
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
            onClick={() => onChange({ ...draft, name: draft.name || p.name, prompt: p.prompt })}
            title={p.prompt}
          >
            {p.label}
          </button>
        ))}
      </div>
      <ModelPicker
        provider={draft.provider}
        model={draft.model}
        onProvider={(provider) => onChange({ ...draft, provider, model: "" })}
        onModel={(model) => onChange({ ...draft, model })}
      />
    </section>
  );
}
