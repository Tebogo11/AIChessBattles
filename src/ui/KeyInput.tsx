import { useState } from "react";
import { getKey, setKey, type KeyedProvider } from "../bots/keyStore";

const REPO_URL = "https://github.com/Tebogo11/AIChessBattles";
const LABEL: Record<KeyedProvider, string> = { openai: "OpenAI", gemini: "Google" };

/**
 * The API-key input for one provider, shown once per provider only while it's
 * selected. The key is stored in the browser key store — sessionStorage by
 * default, localStorage on explicit opt-in — and sent straight to the provider,
 * never to our backend. That claim is stated here with a link to the source so
 * it is checkable (SPEC §9.3).
 */
export function KeyInput({ provider }: { provider: KeyedProvider }) {
  const [value, setValue] = useState(() => getKey(provider) ?? "");
  const [remember, setRemember] = useState(false);
  const label = LABEL[provider];

  const commit = (next: string, rememberNext: boolean) => {
    setValue(next);
    setKey(provider, next, rememberNext);
  };

  return (
    <div className="keyinput" aria-label={`${label} API key`}>
      <label className="keyinput__label">
        {label} API key
        <input
          type="password"
          autoComplete="off"
          placeholder={`Paste your ${label} key`}
          value={value}
          onChange={(e) => commit(e.target.value, remember)}
        />
      </label>
      <label className="keyinput__remember">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => {
            setRemember(e.target.checked);
            commit(value, e.target.checked);
          }}
        />
        Remember on this device
      </label>
      <p className="keyinput__note">
        Sent directly from your browser to {label}, never to our server.{" "}
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          Check the source
        </a>
        .
      </p>
    </div>
  );
}
