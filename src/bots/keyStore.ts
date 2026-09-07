import type { Provider } from "../game/botConfig";

/**
 * Where API keys live in the browser. sessionStorage by default — cleared when
 * the tab closes — with an explicit opt-in to remember on this device
 * (localStorage). Keys go straight from here to the provider and must never
 * reach a Convex mutation, an error log, or a VITE_-inlined env var (SPEC §9.3).
 */

const PREFIX = "aicb_key_";
const keyName = (p: Provider) => `${PREFIX}${p}`;

/** Providers that require a user-supplied key (Ollama and random do not). */
export type KeyedProvider = "openai" | "gemini";

export function providerNeedsKey(provider: Provider): provider is KeyedProvider {
  return provider === "openai" || provider === "gemini";
}

function safeGet(storage: Storage, name: string): string | null {
  try {
    return storage.getItem(name);
  } catch {
    return null; // storage can throw in private mode / restricted contexts
  }
}

/** The key for a provider, preferring the tab's session over a remembered one. */
export function getKey(provider: Provider): string | null {
  if (typeof window === "undefined") return null;
  const name = keyName(provider);
  return safeGet(window.sessionStorage, name) ?? safeGet(window.localStorage, name);
}

/**
 * Store a key. Always in sessionStorage; also in localStorage when the user
 * ticks "remember on this device". Un-remembering clears the persistent copy.
 */
export function setKey(provider: Provider, key: string, remember: boolean): void {
  if (typeof window === "undefined") return;
  const name = keyName(provider);
  const trimmed = key.trim();
  try {
    if (trimmed) window.sessionStorage.setItem(name, trimmed);
    else window.sessionStorage.removeItem(name);
    if (remember && trimmed) window.localStorage.setItem(name, trimmed);
    else window.localStorage.removeItem(name);
  } catch {
    // Ignore storage failures; the key simply won't persist.
  }
}

export function hasKey(provider: Provider): boolean {
  return !providerNeedsKey(provider) || getKey(provider) !== null;
}

export function clearKey(provider: Provider): void {
  setKey(provider, "", false);
}
