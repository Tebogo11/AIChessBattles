# 09: Personas

**What to build:** Before the match starts, each raw prompt is turned into a persona — a structured profile with a name, a few traits, an opening preference, a risk tolerance, a speech register and a catchphrase or two. The user sees both personas as cards and can look at them before pressing Start. The profile is frozen for the whole match.

This is the moment the app justifies itself: the user sees that the AI understood "Li Mu from Kingdom" before a single move is played. It is also the debug surface when a bot plays out of character.

No web research. Synthesis draws on what the model already knows — scraping adds 10–30 seconds of startup latency, breaks when sites change, and for a fictional character the model likely knows more than a fan-wiki page would give (SPEC §6). This is a deliberate deviation from `ProjectSummary.txt`.

This ticket also establishes **the one function that assembles a bot's context**, and it is where the visibility rule lives: a bot sees its own reasoning and both bots' speech, never the opponent's reasoning (SPEC §7). Note this is a prompt-assembly rule, not a security boundary — with a single spectator, everything reaches that client anyway.

**Blocked by:** 05, 06

**Status:** ready-for-agent

- [ ] One synthesis call per bot at match start, producing a structured profile
- [ ] Both persona cards are shown before Start and the user can read them before committing
- [ ] The profile is frozen for the match and stored, so a replay shows the persona that actually played
- [ ] Synthesis failure or an unknown character falls back silently to the raw prompt — the match never blocks
- [ ] Context assembly happens in exactly one place
- [ ] A bot's context provably excludes the opponent's reasoning
