import { useEffect, useState } from "react";
import { listOllamaModels } from "../bots/ollamaClient";
import { OPENAI_MODELS } from "../bots/openaiClient";
import { GEMINI_MODELS } from "../bots/geminiClient";
import type { Provider } from "../game/botConfig";

const CURATED: Partial<Record<Provider, string[]>> = {
  openai: OPENAI_MODELS,
  gemini: GEMINI_MODELS,
};

const FREE_TEXT = "__other__";

/**
 * Per-bot provider + model selection: a curated dropdown plus a free-text
 * override, because model ids churn and a hardcoded list rots while free text
 * alone produces baffling typos (SPEC §9.1). For Ollama the list is the models
 * the user has actually pulled, fetched live from /api/tags.
 */
export function ModelPicker({
  provider,
  model,
  onProvider,
  onModel,
}: {
  provider: Provider;
  model: string;
  onProvider: (p: Provider) => void;
  onModel: (m: string) => void;
}) {
  const [ollamaModels, setOllamaModels] = useState<string[] | null>(null);
  const [ollamaError, setOllamaError] = useState(false);

  useEffect(() => {
    if (provider !== "ollama") return;
    let live = true;
    setOllamaError(false);
    listOllamaModels()
      .then((m) => live && setOllamaModels(m))
      .catch(() => live && setOllamaError(true));
    return () => {
      live = false;
    };
  }, [provider]);

  const curated =
    provider === "ollama" ? (ollamaModels ?? []) : (CURATED[provider] ?? []);
  const usingFreeText = model !== "" && !curated.includes(model);

  return (
    <div className="modelpicker">
      <label className="modelpicker__field">
        <span>Provider</span>
        <select value={provider} onChange={(e) => onProvider(e.target.value as Provider)}>
          <option value="random">Random (no model)</option>
          <option value="ollama">Ollama (local)</option>
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini</option>
        </select>
      </label>

      {provider !== "random" ? (
        <label className="modelpicker__field">
          <span>Model</span>
          <select
            value={usingFreeText ? FREE_TEXT : model}
            onChange={(e) => onModel(e.target.value === FREE_TEXT ? "" : e.target.value)}
          >
            <option value="" disabled>
              Choose a model…
            </option>
            {curated.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value={FREE_TEXT}>Other…</option>
          </select>
        </label>
      ) : null}

      {provider !== "random" && (usingFreeText || curated.length === 0) ? (
        <input
          className="modelpicker__freetext"
          type="text"
          placeholder="model id, e.g. llama3.2"
          value={model}
          onChange={(e) => onModel(e.target.value)}
        />
      ) : null}

      {provider === "ollama" && ollamaError ? (
        <p className="modelpicker__hint">
          Couldn't list local models — is Ollama running? You can still type a model id.
        </p>
      ) : null}
    </div>
  );
}
