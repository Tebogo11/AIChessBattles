# 05: Setup screen

**What to build:** The screen from the wireframes: name and prompt for each bot, side by side, then Start. Prompts are used directly as each bot's instructions — no persona synthesis yet, which is exactly the fallback path the design already calls for (SPEC §6), so this is real behaviour rather than a stub.

The prompt box is the product and should dominate the layout. A row of one-click presets sits beside it, because two empty textareas tell a first-time visitor nothing about what a good persona prompt looks like — and the presets are what teach them that "a fictional manga strategist" is a legitimate input.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Name and free-text prompt per bot, laid out as in `Wirefirms.png`
- [ ] 5–6 one-click presets that fill a prompt box and remain fully editable afterwards
- [ ] Presets span the range in `ProjectSummary.txt`: terse strategy instructions through named characters
- [ ] Colour assignment with randomise on by default; the assignment is visible on the board during the match (SPEC §4.6)
- [ ] Start creates a match with these prompts stored on it and navigates to the match URL
- [ ] Prompts are stored on the match so a replay shows what was originally written
