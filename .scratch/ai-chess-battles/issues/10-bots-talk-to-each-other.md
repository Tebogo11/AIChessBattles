# 10: Bots talk to each other

**What to build:** A shared conversation beneath the board, both bots interleaved chronologically. A bot's speech enters the other bot's context, so a taunt can actually get a reply — this is where the personas stop being flavour text and start being a match.

Speech is **optional per move**. The persona is told to speak when it has something worth saying — a reaction to a capture, a response to the opponent — and to stay quiet otherwise. Two bots times eighty plies of mandatory dialogue becomes padding by the midgame; sparse dialogue reads as character (SPEC §4.3).

A single shared log, not per-panel bubbles: interleaving chronologically is the only layout where a taunt and its reply sit next to each other (SPEC §9.2).

**Blocked by:** 09

**Status:** ready-for-agent

- [ ] Shared speech log beneath the board, both bots interleaved in time order
- [ ] The persona prompt permits silence and bots use it — not every ply produces speech
- [ ] Empty speech renders as nothing, not as a blank entry
- [ ] Each bot's context includes the full speech log from both sides
- [ ] Bots demonstrably respond to each other, not just monologue
- [ ] Speech is stored per ply and appears correctly when scrubbing or replaying
