import type { BotConfig } from "../game/botConfig";

/**
 * The persona card shown before Start — the moment the app shows it understood
 * "Li Mu from Kingdom" before a move is played, and the debug surface when a bot
 * plays out of character (SPEC §6). Falls back to the raw prompt when synthesis
 * was skipped or failed.
 */
export function PersonaCard({ config, side }: { config: BotConfig; side: "w" | "b" }) {
  const p = config.persona;
  return (
    <section className="persona" aria-label={`${config.name} persona`}>
      <header className="persona__header">
        <span className={`dot dot--${side}`} aria-hidden="true" />
        <h3>{p?.name || config.name}</h3>
      </header>

      {p ? (
        <dl className="persona__fields">
          {p.traits.length ? (
            <div>
              <dt>Traits</dt>
              <dd>{p.traits.join(", ")}</dd>
            </div>
          ) : null}
          {p.openingPreference ? (
            <div>
              <dt>Openings</dt>
              <dd>{p.openingPreference}</dd>
            </div>
          ) : null}
          {p.riskTolerance ? (
            <div>
              <dt>Risk</dt>
              <dd>{p.riskTolerance}</dd>
            </div>
          ) : null}
          {p.speechRegister ? (
            <div>
              <dt>Voice</dt>
              <dd>{p.speechRegister}</dd>
            </div>
          ) : null}
          {p.catchphrases.length ? (
            <div>
              <dt>Might say</dt>
              <dd>{p.catchphrases.map((c) => `“${c}”`).join(" ")}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <div className="persona__raw">
          <p className="persona__rawlabel">Playing from your prompt:</p>
          <p className="persona__rawprompt">{config.prompt}</p>
        </div>
      )}
    </section>
  );
}
