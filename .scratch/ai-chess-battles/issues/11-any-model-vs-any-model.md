# 11: Any model vs any model

**What to build:** The feature the app exists for — GPT against Gemini, Gemini against a local Llama, chosen per bot on the setup screen with the user's own keys.

OpenAI and Gemini implementations behind the existing model interface, plus everything needed to select and authenticate them from the UI. Merged into one ticket so there is never a state where the providers exist but can't be reached.

**Model selection:** a curated dropdown plus a free-text override. Hardcoded lists rot as model IDs churn; free text alone produces baffling typo failures. For Ollama, list the models the user has actually pulled rather than guessing.

**Keys:** `sessionStorage` by default, cleared when the tab closes, with an explicit opt-in to remember on the device. Keys go straight from the browser to the provider. Many people will hesitate before pasting an API key into an unfamiliar site and they are right to — how this is handled is itself portfolio work (SPEC §9.3).

**Ollama for visitors** is the awkward case: a deployed page reaching someone's local Ollama needs `OLLAMA_ORIGINS` to include that origin, and Safari is stricter than Chrome. This must produce a specific, actionable message, not a generic network error.

**Blocked by:** 05, 06

**Status:** ready-for-agent

- [ ] OpenAI and Gemini implementations behind the same model interface as Ollama
- [ ] Provider and model chosen independently per bot; mixed matchups run end to end
- [ ] Model config is one collapsed row per bot on the setup screen, not a flat wall of fields (SPEC §9.1)
- [ ] Curated model list plus free-text override; Ollama's list comes from the user's actually-installed models
- [ ] A key is requested only when a provider needing one is selected, and only once per provider
- [ ] Keys stored in `sessionStorage` by default, with an explicit "remember on this device" opt-in
- [ ] Keys never appear in a backend call, an error log, or a build-time-inlined environment variable (SPEC §9.3)
- [ ] The "sent directly from your browser, never touches our server" line is shown, with a link to the public repo
- [ ] **Repository made public** so that claim is checkable
- [ ] A failed browser-to-local-Ollama request shows the exact fix, not a generic network error
- [ ] A bad model ID surfaces the provider's verbatim error
