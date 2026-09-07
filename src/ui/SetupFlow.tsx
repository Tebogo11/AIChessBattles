import { useState } from "react";
import { assignColors } from "../game/assignColors";
import type { BotConfig } from "../game/botConfig";
import { synthesizeMatchup } from "../game/synthesizeMatchup";
import { PersonaCard } from "./PersonaCard";
import { SetupScreen, type SetupValues } from "./SetupScreen";

type Phase =
  | { name: "edit" }
  | { name: "synthesizing" }
  | { name: "preview"; white: BotConfig; black: BotConfig };

interface SetupFlowProps {
  /** Called with the finalised, colour-assigned, persona-bearing configs. */
  onConfirm: (white: BotConfig, black: BotConfig) => void;
  /** True while the match is being created after confirm. */
  creating?: boolean;
  /** Pre-fill the setup forms, e.g. from "Edit prompts" (SPEC §9.4). */
  initial?: { first: BotConfig; second: BotConfig };
}

/**
 * The full pre-match flow: edit prompts, synthesise personas, then let the user
 * read both persona cards before committing (SPEC §6, §9.1). Shared by the
 * persisted and local routes; they differ only in what onConfirm does.
 */
export function SetupFlow({ onConfirm, creating, initial }: SetupFlowProps) {
  const [phase, setPhase] = useState<Phase>({ name: "edit" });

  const start = async (values: SetupValues) => {
    const assigned = assignColors(values.first, values.second, values.randomizeColors);
    setPhase({ name: "synthesizing" });
    // Synthesis draws only on model knowledge; it may no-op to the raw prompt.
    const { white, black } = await synthesizeMatchup(assigned.white, assigned.black);
    setPhase({ name: "preview", white, black });
  };

  if (phase.name === "synthesizing") {
    return (
      <div className="app">
        <header className="app__header">
          <h1>AI Chess Battles</h1>
          <p className="app__tagline">Summoning personas…</p>
        </header>
      </div>
    );
  }

  if (phase.name === "preview") {
    return (
      <div className="app">
        <header className="app__header">
          <h1>AI Chess Battles</h1>
          <p className="app__tagline">Meet your players. White moves first.</p>
        </header>

        <div className="persona-preview">
          <PersonaCard config={phase.white} side="w" />
          <div className="setup__vs" aria-hidden="true">
            VS
          </div>
          <PersonaCard config={phase.black} side="b" />
        </div>

        <div className="setup__footer">
          <button
            type="button"
            className="linkbtn"
            onClick={() => setPhase({ name: "edit" })}
            disabled={creating}
          >
            ← Back to edit
          </button>
          <button
            type="button"
            className="setup__start"
            onClick={() => onConfirm(phase.white, phase.black)}
            disabled={creating}
          >
            {creating ? "Starting…" : "Start match"}
          </button>
        </div>
      </div>
    );
  }

  return <SetupScreen onStart={(v) => void start(v)} initial={initial} />;
}
