# Security to-do — before calling the project done

- [ ] **Rotate the OpenAI and Gemini API keys.** Live keys were pasted into
      `.env` (gitignored, never committed) during development on 2026-09-06 and
      were visible in a chat transcript. Regenerate both in their provider
      dashboards and replace the `OWNER_*` values in `.env`.
      - OpenAI: https://platform.openai.com/api-keys
      - Gemini: https://aistudio.google.com/app/apikey
- [ ] Confirm `.env` and `.env.local` are still gitignored (they are today).
- [ ] These `OWNER_*` keys are only used by the seed script (§10 / ticket #13).
      The app itself is bring-your-own-key and does not need them.

(No secrets are stored in this file on purpose.)
