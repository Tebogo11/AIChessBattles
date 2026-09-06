# 07: Thinking streams live

**What to build:** The two thoughts panels from the wireframes, filling with each bot's reasoning word by word as the model produces it.

This is the ticket that makes the app watchable. A move takes 5–30 seconds on a local model; without streaming, that is a spinner, and the product is twenty seconds of nothing followed by a piece moving. With streaming, the wait *is* the show (SPEC §5).

Because thinking is the first tagged section in the response, it starts arriving immediately — parsing has to work on a partial, still-growing response rather than a complete one.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] Left and right thoughts panels per `Wirefirms.png`, one per bot
- [ ] Reasoning appears progressively as the model generates it, not in one block at the end
- [ ] Partial output is parsed tolerantly — an unclosed tag mid-stream must not break rendering
- [ ] The panel shows which bot is currently thinking
- [ ] Only the completed ply is written to storage; streamed fragments are transient
- [ ] Scrubbing to an earlier move shows that move's stored reasoning
- [ ] No spinner-only state during a bot's turn
