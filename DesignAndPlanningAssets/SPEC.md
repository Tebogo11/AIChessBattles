# AI Chess Battles — Specification

**Status:** agreed design, not yet implemented
**Date:** 2026-09-06
**Supersedes:** `ProjectSummary.txt` and `SystemDesign-Draft.png` where they conflict (noted inline)

---

## 1. What this is

A portfolio web app where two LLM personas play chess against each other.

The user writes a prompt for each bot — anything from "play aggressively" to "play like Li Mu from Kingdom" — and picks a model for each. Each prompt is turned into a persona, and the two personas play a full game. Throughout the match the user sees each bot's **private reasoning** and both bots' **public speech**. The bots can hear each other's speech and respond to it; neither can see the other's reasoning.

The comparison between models is the point: mixed matchups (GPT vs. Gemini vs. a local Llama) are a first-class feature.

**Not a commercial product.** No ads, no funded inference, no accounts.

---

## 2. Money and models

**Bring your own key.** Three providers, selectable **per bot**:

| Provider | Key needed | Notes |
|---|---|---|
| Ollama | No | Local. Works reliably for the developer; friction for visitors (see §9.3) |
| OpenAI | Yes | User-supplied |
| Gemini | Yes | User-supplied |

**All inference runs in the browser.** This is forced, not chosen:

- BYOK means the key belongs to the user; routing it through a server to hold would create a liability that doesn't need to exist.
- Ollama listens on `localhost` — only the user's own browser can reach it. A cloud backend cannot.

**Consequence:** the "AI Engine" box in `SystemDesign-Draft.png` moves out of the backend and into the client. The backend keeps only persistence.

**Ads are out.** One match is 40–80 moves, each needing reasoning + speech + a move with growing context — order 100–250 inference calls per match. Display advertising pays roughly $1–5 per *thousand* page views. The arithmetic does not survive contact at any scale where ads exist.

---

## 3. Stack

| Layer | Choice | Rationale |
|---|---|---|
| UI | React | — |
| Chess rules | `chess.js` | Legal move generation, all termination detection |
| Board | `react-chessboard` | — |
| Persistence | Convex | Match log, replays, resume |
| Auth | **None** | Anonymous session ID; nothing to protect |
| LLM access | **Hand-written adapter** | ~100 lines, one interface, three implementations |
| Hosting | Netlify (free tier) | Familiar to the developer; stable URL, no sleep |
| App shape | Vite SPA | No SSR needed — all inference is client-side, Convex is the backend |

### Dropped from the original plan

- **LangChain** — the need is narrow (send messages, get text). LangChain.js is heavy for that and its abstractions target chains/agents that aren't being built. A `ChessModel` interface with three `fetch` implementations is smaller and more legible to a reviewer.
- **Clerk** — with inference client-side, an account would own nothing but a prompt history. Revisit only if a cross-device prompt library is wanted.
- **`cheerio`** — no scraping (see §6).

### Deployment note

Verify Convex's current free-plan inactivity policy before relying on a demo link staying live for months between visits. Netlify's free tier does not sleep.

**SPA deep links must be configured.** Match and replay URLs (`/match/<id>`) are client-routed. Without a catch-all redirect, refreshing or opening a shared replay link returns Netlify's 404 instead of the app — which breaks the single most important path in §10 and §12. Add to `netlify.toml`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Test this by opening a replay link in a fresh tab, not by navigating to it from within the app — in-app navigation hides the bug.

**Do not hide the URL.** BYOK means a visitor cannot spend the owner's money; the only resource consumed is a little Convex storage. Obscurity protects nothing and defeats the purpose of a portfolio piece.

---

## 4. The move loop

### 4.1 What a bot sees

Each turn, a bot's context contains:

- Its **persona** (system prompt, §6)
- Current **FEN**
- Full **move history**
- **Full list of legal moves** from `chess.js`
- Its **own** reasoning from the last **~6 plies**
- The **full speech log** — both bots

It never sees the opponent's reasoning.

**Why the legal-move list:** LLMs are poor at deriving legal moves from raw board state, and small local models are bad enough at it to make the app unusable. Choosing well from ~30 legal moves is still a genuine test of chess understanding, and it eliminates the large majority of invalid-move retries.

**Why a 6-ply window:** the move list is compact and already carries the game state, so old prose reasoning is the least valuable thing in the context window. The speech log stays complete — it is short and it is the personality thread. Rolling summarisation was considered and rejected: it doubles the failure modes for marginal gain.

### 4.2 What a bot returns

Streamed plain text, tagged sections, **in this order**:

```
<thinking>...</thinking>
<speech>...</speech>
<move>Nf3</move>
```

Parsed incrementally by regex over a growing buffer.

**Why tags, not JSON schema:** streaming and a single JSON object are in direct conflict — a blob cannot render progressively without tolerant partial parsing. Tags stream natively. An 8B local model also mismatches a closing tag far less often than it emits malformed JSON, and the three providers each express structured output differently, so tags avoid per-provider schema plumbing. The move is validated against the legal-move list regardless, so schema guarantees buy little.

`thinking` comes first so the panel starts filling immediately. `move` comes last so it is decided after the reasoning.

### 4.3 Speech is optional

The system prompt instructs the persona to speak when it has something worth saying — a taunt, a reaction to a capture, a reply to the opponent — and to emit an empty `<speech>` otherwise. Two bots × 80 plies of mandatory dialogue becomes padding by the midgame. Sparse dialogue reads as character.

Speech is **bidirectional**: Bot A's taunt enters Bot B's context and B may respond.

### 4.4 Invalid moves

1. Bot returns a move not in the legal list, or unparseable output
2. Retry with correction — up to **3 attempts**
3. On the 3rd failure: **play a random legal move**, logged visibly in that bot's panel as a **stumble**

Forfeiting on a parse error would punish a model for formatting rather than chess. Stumbles are surfaced in the UI and counted on the result card — they are the comparative signal no other chess demo shows.

### 4.5 Match termination

All of `chess.js`'s conditions: checkmate, stalemate, threefold repetition, fifty-move rule, insufficient material.

Plus a hard **150-move cap → adjudicated draw**. Weak models shuffle pieces; without a cap some matches never end.

### 4.6 Colors

User picks, with **randomize on by default**. Assignment is always visible on the board. White has a real first-move advantage, so in a head-to-head model comparison this is not cosmetic — and disclosing it forecloses the "it only won because it was white" objection.

---

## 5. Pacing and controls

**Autoplay with pause; pausing drops into step mode.** Transport controls: `←` `▷` `→`.

A move takes 5–30 seconds on a local model. **Stream tokens into the thinking panel as they arrive** — the wait is the show. Never a 20-second spinner.

**The back arrow is non-destructive scrubbing.** It moves a view cursor over the append-only log to inspect earlier positions, then returns to live. It does **not** rewind and re-decide.

This resolves the contradiction in `Wirefirms.png`, where `←` and `▷` implied both scrubbing and mutation. Keeping the log append-only means the same player component serves live matches and replays — build it once. Destructive rewind, if ever wanted, becomes "fork this match at move N into a new match," which preserves append-only.

---

## 6. Personas

**One synthesis call at match start.** Input: the user's raw prompt. Output: a **structured profile** — name, a few traits, opening preference, risk tolerance, speech register, a couple of catchphrases — rendered into a system prompt template and frozen for the whole match.

**Shown to the user as a persona card before Start.** This is the moment the app justifies itself: the user sees the AI understood "Li Mu" before a single move is played. It is also the debug surface when a bot plays out of character.

**No live web research.** Scraping adds 10–30s of startup latency, breaks when sites change, and for a fictional manga general the model very likely knows more than a scraped fan-wiki page. This deviates from `ProjectSummary.txt`, which asked for online research; ship a research toggle later only if synthesis visibly fails on obscure names.

**On failure** (model doesn't know the character, empty output): silently fall back to using the raw user prompt as the system prompt. **Never block the match.**

---

## 7. Data model

**Two tables.** Not one document.

### `matches`
Personas (as synthesized), raw prompts, provider + model per bot, color assignment, status, result, termination reason, seed flag.

### `plies`
Append-only, keyed by match ID + ply number. Each row: move, resulting FEN, reasoning, speech, stumble flag, timing.

**Why separate:** Convex caps a document at 1 MiB, and a full match plausibly reaches the low hundreds of KB — survivable, but a reactive query on one growing document re-pushes the *entire* match to the client on every ply. By move 70 the whole game is re-sent to render one new move. Separate rows let the client subscribe to the range it displays, and make scrubbing (§5) and resume (§8) natural rather than bolted on.

### Where the hidden-thoughts rule lives

Convex pushes the match to the single spectating client regardless, so "invisible to the other AI" is **not** a security property — it is a **prompt-assembly rule**. Enforce it in **one** function that builds a bot's context: include own reasoning + both speech logs, exclude opponent reasoning.

---

## 8. Failure and resume

The browser tab is the match engine. It will close.

- Every ply is appended to Convex as it completes
- Tab closes → match is marked **`stalled`**, not "running"
- Reopening the match URL offers **Resume** and continues from the log
- An in-flight move when the tab dies is simply lost and regenerated — nothing was committed

Background tabs are heavily timer-throttled by Chrome, so an autoplaying match in a background tab will crawl. Resume makes this recoverable rather than fatal.

### Provider errors — distinct from invalid moves

Rate limit, expired key, network drop at move 40:

1. **3 retries with exponential backoff**
2. Then mark the match **`stalled`** with the provider's **verbatim error** shown, and a Resume button

**Never auto-fall back to another provider.** Silently swapping the model mid-match destroys the one thing the app measures.

---

## 9. UI

### 9.1 Setup screen

The prompt box is the product and must dominate. Everything else is progressive:

- Name + prompt per bot — prominent
- Model config — **one collapsed row per bot** showing the current selection
- API key — requested **only** when a provider needing one is selected, and **only once per provider**

**Preset prompts:** 5–6 one-click presets that fill the textarea and remain editable. These solve the blank-page problem and teach the user that "a fictional manga strategist" is a legitimate input — the idea most likely to make someone share the app. Include the two from `ProjectSummary.txt`.

**Model selection:** curated dropdown + free-text override. Model IDs churn, so a hardcoded list rots; free text alone produces confusing typo failures.

- Ollama: live-list the user's pulled models from `GET /api/tags`
- OpenAI / Gemini: short curated list + "other" field
- Show the raw provider error verbatim on a bad model ID — fastest path to self-correction

### 9.2 Match screen

Per `Wirefirms.png`: thoughts panel left, board centre, thoughts panel right.

**Addition:** a **shared speech log beneath the board**, both bots interleaved chronologically. Speech is a conversation; interleaving is the only layout where a taunt and its reply sit adjacent. Per-panel bubbles would split a dialogue across the screen.

**Mobile:** board + shared speech log as the default view; thoughts panels as a tap-triggered slide-over — matching the wireframe, and putting the conversation rather than raw reasoning in the small-screen default.

### 9.3 API keys

**`sessionStorage` by default** — cleared when the tab closes — with an explicit "remember on this device" opt-in for `localStorage`.

Show one line beside the input:

> Your key is sent directly from your browser to OpenAI/Google and never touches our server.

Link to the source repo. **The repo must be public** for this claim to be checkable — an unverifiable security claim next to a key input is worse than no claim.

**This must stay true.** The key must never appear in a Convex mutation argument, and never in an error log.

**Vite trap:** any env var prefixed `VITE_` is inlined into the client bundle at build time and ships to every visitor. The owner's key — used by the seed script (§10) — must never be a `VITE_` variable. Keep seed generation out of the browser build entirely: run it as a Node script against Convex, reading the key from a plain (unprefixed) environment variable.

**Ollama friction:** a visitor's browser reaching their `localhost` Ollama requires `OLLAMA_ORIGINS` to include the deployed origin, and Safari is stricter than Chrome about such requests. Detect the failure and surface the exact command to run — not a generic network error. Treat OpenAI/Gemini as the visitor paths and Ollama as the developer path.

### 9.4 Result card

On termination: winner, termination reason (checkmate / stalemate / repetition / fifty-move / 150-cap), move count, **stumble count per bot**, share link, and two actions — **Rematch same config** and **Edit prompts**.

Do not auto-redirect to the replay. The user just watched a game end and needs a beat.

---

## 10. The front door

**An employer arrives with no API key and no Ollama.** Hosting is not the demo problem; this is. Left unsolved, they leave in fifteen seconds.

**The landing page autoplays a seeded replay.** No key required. "Run your own" is the secondary action.

- Seed **3–4 genuinely good matches** — e.g. Li Mu vs. Tal, GPT vs. Gemini, something with a dramatic blunder
- Zero cost, never breaks, shows the entire product in ten seconds
- This makes replays the front door rather than a nice-to-have

A funded demo match was rejected: it reintroduces the cost problem, and a rate limit means the demo breaks exactly when several people look at once — which for a portfolio is precisely when it matters.

**Replays are public-but-unlisted.** Anyone with the link can watch; nothing is enumerable. A **curated gallery** lists matches the owner picks. No public feed of everything strangers generate — that is a moderation obligation on a personal site with a free-form prompt box.

**Keeping seeds alive:** a `seed` script that runs the matches with the owner's key and marks them seeded, re-run whenever the ply shape changes. Four rows is not a migration problem, and version-tolerant rendering is machinery for nothing. Add a smoke check that the landing page's seed loads — that is the one thing that must never silently break.

---

## 11. Build order

Skeleton first. Building the LLM call first means debugging a chess state machine, an append-only log, scrubbing, and resume *while* paying 20 seconds and tokens per iteration.

| # | Milestone | Contents |
|---|---|---|
| 1 | **Skeleton, no AI** | Board + `chess.js` + two random-move bots. Autoplay / pause / step. Plies appended to Convex. Scrubbing. All termination rules + 150-move cap. Iterates instantly. |
| 2 | **One real model** | Ollama adapter. Tagged-section parsing. Streaming into thinking panel. Legal-move list. Retry → random fallback + stumble logging. |
| 3 | **Personas** | Synthesis call. Persona card. Context assembly with the hidden-thoughts rule. Shared speech log. |
| 4 | **Multi-provider** | OpenAI + Gemini adapters. Key handling. Model pickers. |
| 5 | **The product** | Replays, seed script, landing page, result card, presets, mobile. |

Milestone 1 is the one most likely to be skipped and the one that de-risks the most.

---

## 12. Definition of done — v1

> A stranger opens the URL and a seeded match is already playing itself, with no key. They paste a Gemini key, write two prompts, and watch a match run to a natural termination — on desktop and on a phone. The replay link they share works.

Everything beyond that is v2.

---

## 13. Explicitly out of scope

Each was removed for a stated reason, not by preference. If one returns, it should return with a reason that changed.

| Excluded | Why |
|---|---|
| Ads / any funding model | Arithmetic doesn't work (§2) |
| Auth / Clerk | Account would own nothing (§3) |
| LangChain | Heavy for a narrow need (§3) |
| `cheerio` / live scraping | Latency, fragility, low value (§6) |
| Human vs. AI play | Not the product |
| Public match feed | Moderation obligation (§10) |
| Rolling context summarisation | Doubles failure modes (§4.1) |
| Destructive rewind | Breaks append-only; deferred as "fork a match" (§5) |
