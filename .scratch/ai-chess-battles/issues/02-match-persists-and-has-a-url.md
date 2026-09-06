# 02: Match persists and has a URL

**What to build:** A match now survives a refresh. Starting a game creates a match record; every move is written as it happens. The match has its own URL, and opening that URL — in a new tab, on another device — renders the game from stored history rather than from what happens to be in memory.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Convex project wired to the app
- [ ] `matches` table holds match-level config, status, result and termination reason
- [ ] `plies` table is append-only, keyed by match and ply number, holding the move and resulting position (SPEC §7)
- [ ] Each move is written as it completes, not batched at the end
- [ ] A match URL loads and replays the stored game correctly in a fresh tab
- [ ] Adding a move re-renders without re-sending the whole match to the client
