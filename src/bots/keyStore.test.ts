import { afterEach, describe, expect, it } from "vitest";
import { clearKey, getKey, hasKey, providerNeedsKey, setKey } from "./keyStore";

afterEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
});

describe("keyStore", () => {
  it("knows which providers need a key", () => {
    expect(providerNeedsKey("openai")).toBe(true);
    expect(providerNeedsKey("gemini")).toBe(true);
    expect(providerNeedsKey("ollama")).toBe(false);
    expect(providerNeedsKey("random")).toBe(false);
  });

  it("stores in window.sessionStorage by default, not window.localStorage", () => {
    setKey("openai", "sk-abc", false);
    expect(getKey("openai")).toBe("sk-abc");
    expect(window.sessionStorage.getItem("aicb_key_openai")).toBe("sk-abc");
    expect(window.localStorage.getItem("aicb_key_openai")).toBeNull();
  });

  it("persists to window.localStorage only when remember is on", () => {
    setKey("gemini", "g-key", true);
    expect(window.localStorage.getItem("aicb_key_gemini")).toBe("g-key");
  });

  it("un-remembering clears the persistent copy", () => {
    setKey("openai", "sk-abc", true);
    setKey("openai", "sk-abc", false);
    expect(window.localStorage.getItem("aicb_key_openai")).toBeNull();
    expect(getKey("openai")).toBe("sk-abc"); // still in session
  });

  it("hasKey is true for keyless providers and reflects stored keys", () => {
    expect(hasKey("ollama")).toBe(true);
    expect(hasKey("openai")).toBe(false);
    setKey("openai", "sk", false);
    expect(hasKey("openai")).toBe(true);
    clearKey("openai");
    expect(hasKey("openai")).toBe(false);
  });
});
