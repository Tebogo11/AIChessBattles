# 15: Fixed layout, game analysis and exports

**Blocked by:** 12, 13, 14

**Status:** ready-for-agent

## Problem Statement

Watching a match is harder than it should be, for four separate reasons.

The reasoning panels grow token by token while a bot is thinking. Because they sit in the same grid as everything else, every token reflows the page — the board and the transport controls shift under the cursor while the user is trying to read. The redesign request came from this specific symptom, not from a general wish for a new look.

The speech log lives under the board in the centre column, so the conversation between the bots — the thing that makes a match legible at a glance — is below the fold on a desktop screen. The user has to scroll away from the board to read it, then scroll back.

Nothing on the match screen says which bot is White and which is Black. The setup screen compounds this: it labels the two forms "Bot A" and "Bot B", and by default randomises colours, so the first form has no stable relationship to a colour.

Finally, a finished match leaves nothing behind. There is no way to keep the reasoning, no way to export the moves, and no measure of who was actually winning at any point — the result card reports the outcome and the stumble counts, and nothing else.

## Solution

A fixed three-column match layout that cannot shift while a bot is streaming, with the conversation permanently in view; explicit colour identity everywhere; a record of the game the user can take away; and an on-demand engine analysis that plots the balance of the game from first ply to last.

Concretely: bot cards on the left, board in the centre, speech log on the right, all at fixed pixel widths. Reasoning moves out of the bot cards into a single 50%-width block below the board, split into a White lane and a Black lane, each with a fixed height and its own internal scroll — so a growing stream moves nothing outside its own box. Each bot card carries a colour badge and, beneath it, the pieces that bot has captured with a material-advantage badge. The setup screen states plainly that the first form plays White and the second plays Black, with randomisation as an opt-in that is off by default. When the match ends, the user can download the reasoning as Markdown and the moves as a PGN, follow a link to replay that PGN at chesstempo.com, and run a Stockfish analysis that draws a win-probability curve across the whole game with stumbles marked as events on the line.

## User Stories

1. As a spectator, I want the board to stay still while a bot is thinking, so that I can read the position without it jumping under my eyes.
2. As a spectator, I want streaming reasoning to be confined to a fixed-height box, so that a long stream never reflows the rest of the page.
3. As a spectator, I want the reasoning box to scroll itself to the newest text, so that I can follow a stream without dragging a scrollbar.
4. As a spectator, I want both bots' reasoning side by side in one place, so that I can compare how they thought about the same position.
5. As a spectator, I want the reasoning block to be a fixed 50% of the width, so that lines are short enough to read comfortably.
6. As a spectator, I want the two reasoning lanes to divide that block evenly, so that neither bot's column is cramped.
7. As a spectator, I want the conversation between the bots visible beside the board, so that I never have to scroll away from the game to read it.
8. As a spectator, I want the speech log to scroll internally rather than growing the page, so that the layout is stable however long the game runs.
9. As a spectator, I want each bot's card fixed in size, so that the left column never changes shape mid-match.
10. As a spectator, I want every column at a fixed pixel width, so that resizing my window does not rearrange the match view.
11. As a spectator on a phone, I want the layout to stack into one column as it does today, so that the redesign does not cost me the mobile support already shipped.
12. As a spectator on a phone, I want a button that opens both bots' details in a modal, so that I can read their prompts without a permanent card taking up the screen.
13. As a spectator, I want a colour badge on each bot card, so that I can tell at a glance which bot is White.
14. As a spectator, I want the bot cards ordered White first, then Black, so that the ordering itself carries meaning.
15. As a spectator, I want each bot card to show its provider and model, so that I know which model produced which play.
16. As a spectator, I want each bot card to show the prompt it was given, clamped to a couple of lines, so that the card stays a fixed size.
17. As a spectator, I want to expand a bot's prompt in place, so that I can read the whole thing when I care to.
18. As a spectator, I want to see the pieces each bot has captured, so that I can judge the material balance without counting the board.
19. As a spectator, I want captured pieces grouped by type and ordered by value, so that the row is scannable rather than a jumble.
20. As a spectator, I want a material-advantage badge when a bot is ahead, so that I get the single most useful number without doing arithmetic.
21. As a spectator, I want captured pieces to update as I scrub, so that the display always matches the position I am looking at.
22. As a spectator opening a shared or seeded replay, I want captured pieces to appear there too, so that the feature is not limited to live matches.
23. As someone setting up a match, I want the first form labelled as White and the second as Black, so that I know which bot will play which colour before I start.
24. As someone setting up a match, I want a randomise-colours toggle that is off by default, so that the labels are true unless I choose otherwise.
25. As someone setting up a match, I want the labels to change when I enable randomisation, so that the form never tells me something false.
26. As someone who just finished a match, I want to download the reasoning as a Markdown file, so that I can read or share the bots' thinking outside the app.
27. As someone who just finished a match, I want the reasoning file ordered chronologically with both bots interleaved, so that it reads as one narrative rather than two lists.
28. As someone who just finished a match, I want to download the game as a PGN, so that I can open it in any chess tool.
29. As someone who just finished a match, I want each bot's reasoning attached to its moves as PGN comments, so that the file is self-contained.
30. As someone who just finished a match, I want a link to chesstempo's PGN viewer, so that I know where to replay the game I downloaded.
31. As someone who just finished a match, I want the link to tell me to download the PGN first, so that I am not left guessing what to paste.
32. As someone who just finished a match, I want an "Analyse game" button, so that analysis costs me nothing unless I ask for it.
33. As someone analysing a game, I want a progress indicator, so that I know a slow analysis is still working.
34. As someone analysing a game, I want the chart to fill in as results arrive, so that I see something useful before the whole game is done.
35. As someone analysing a game, I want the page to stay responsive throughout, so that I can keep scrubbing while it runs.
36. As someone reading the chart, I want a fixed 0–100 win-probability axis, so that one blunder does not flatten the rest of the game.
37. As someone reading the chart, I want the area above and below the halfway line filled in each side's colour, so that I can read the story at a glance.
38. As someone reading the chart, I want one point per ply rather than per full move, so that each bot's individual decision is visible.
39. As someone reading the chart, I want every point from White's perspective, so that the line does not zigzag meaninglessly between turns.
40. As someone reading the chart, I want forced mates pinned to the top or bottom, so that a mate reads as decisive rather than as a missing value.
41. As someone reading the chart, I want stumbles marked on the line where they happened, so that I can see whether a bot's failure to produce a legal move cost it the game.
42. As someone reading the chart, I want stumble counts in the legend, so that I get the totals without counting markers.
43. As someone reading the chart, I want it at a fixed size, so that it obeys the same no-resizing rule as the rest of the screen.
44. As a visitor to the landing page, I want the autoplaying replay to stay as fast as it is now, so that analysis never runs without being asked for.

## Implementation Decisions

**Match layout.** Three fixed columns replacing the current `1fr minmax(320px,520px) 1fr` grid: bot cards 300px, board 520px, speech log 360px, two 20px gaps, 1220px total inside the existing 1280px page cap. No `fr` units and no `minmax` — the widths are literal pixels so that nothing responds to content. The board holds its current 520px maximum so it never resizes mid-game. Below the columns sits the reasoning block at 50% width, centred, containing two lanes that each take an equal share with space between them.

The existing 900px and 720px breakpoints are retained. Below them the layout stacks into a single column exactly as it does today; the fixed-width rule is a desktop rule only.

**Layout stability.** The reasoning lanes get an explicit height of 320px and their own vertical scroll, auto-scrolled to the bottom as tokens arrive. This is the mechanism that actually solves the reported problem: a stream of unknown length cannot move anything outside a box whose height is set in advance. A minimum height that grows past a guess was rejected — it still shifts once exceeded.

**Reasoning relocates.** Live streaming reasoning moves out of the bot panels and into the reasoning block, rendering in the lane belonging to the streaming side. Historical per-ply reasoning renders in the same lanes. One place for reasoning, live or historical; the bot cards become static as a result. The scrub cursor continues to highlight the ply under review, in the lane rather than the card.

**Bot cards.** Each card carries a colour badge, the bot's name, its provider and model, and its raw prompt clamped to roughly two lines with an in-place expander. The raw prompt is shown rather than the synthesised persona. On mobile the cards collapse to a button opening a modal containing both bots' details.

**Captured pieces.** Derived, not stored. Replaying the stored SAN of each ply through chess.js yields the captured piece for every capturing move, so captures are computed from data the match already has. This deliberately avoids a schema change and means seeded and shared replays gain the feature for free. Rendered as glyphs grouped by piece type, ordered most valuable first, with a material-advantage badge shown only for the side that is ahead. The display is a function of the scrub cursor, so it always reflects the position on screen.

**Colour assignment.** The first setup form plays White, the second plays Black, and the forms say so. A randomise-colours toggle remains but defaults to **off** — reversing today's default. When it is switched on, the form headings change to indicate colours will be drawn at random, so the labels are never wrong. This resolves a direct contradiction in the original request between fixed labels and default randomisation.

**Reasoning export.** A pure function turning the ply list plus both bot names into a Markdown document: one section per move in chronological order, with each bot's reasoning under its own move, so the file reads as a single narrative. Delivered as a client-side download; no backend involvement.

**PGN export.** A pure function producing a standard seven-tag roster with the bot names as the White and Black tags and the match result in the Result tag, followed by the movetext. Each move carries the moving bot's reasoning as a PGN comment, truncated to roughly 200 characters, which keeps the file self-contained and renderable by third-party viewers without letting a long stream bloat it. Built with chess.js so that the movetext and the comment attachment follow the standard rather than hand-rolled string assembly.

**Chesstempo link.** Placed beside the PGN download on the result card, pointing at `https://chesstempo.com/pgn-viewer/`, opening in a new tab, with adjacent copy telling the user to download the PGN first and paste it there.

**Analysis engine.** `stockfish@18` running **single-threaded in a Web Worker**. Multi-threading is deliberately declined: it requires `SharedArrayBuffer`, which requires COOP/COEP headers, which would make the whole site cross-origin isolated for the sake of one optional chart. Analysis runs at **depth 12** — the low end of the useful range, chosen because the difference from depth 14 is invisible at chart resolution while the runtime is materially shorter. A 60-move game is expected to take tens of seconds.

Analysis is **on demand only**, triggered from a button on the result card, and its results are **not persisted**. This keeps the landing-page replay as cheap as it is today and avoids a schema change; the cost is that each viewer of a shared match recomputes it.

The engine sits behind an injectable interface — a module that accepts positions and yields evaluations — mirroring how `ChatClient` already abstracts the model providers. The real implementation wraps the worker; tests supply a fake. This is the single new seam the feature introduces.

**Evaluation to win probability.** Centipawns are converted with the Lichess curve:

```
winPct = 50 + 50 * (2 / (1 + exp(-0.00368208 * cp)) - 1)
```

giving a bounded 0–100 axis from White's perspective. Three details that are the usual source of a wrong chart, and which the implementation must get right:

- Stockfish reports scores **relative to the side to move**, so the sign is flipped on Black's turns. Without this the line zigzags between plies and means nothing.
- The point of view flip is applied **before** deciding whether a forced mate maps to 100 or 0. A `mate -3` means the side to move gets mated, so the sign matters to the outcome.
- Stockfish emits one `info` line per depth iteration; the **last** one is the deepest and is the one to read.

**Chart.** `recharts@3.10.1` (React 19 compatible), rendered with explicit `width` and `height` props rather than a responsive container — the responsive container's resize behaviour directly contradicts the fixed-sizing rule this issue exists to enforce. An area chart with ply on the x-axis, win probability on a fixed 0–100 y-axis, a reference line at 50, and the area split above and below that line in each side's colour. Stumbles appear as per-side markers on the line at the ply where they occurred, and as counts in the legend, so a stumble reads as an event in the game rather than a detached statistic.

## Testing Decisions

A good test here asserts what a user can observe and nothing else. For the UI that means querying by role, label and visible text — never by class name, never by component internals — so that the layout can be restyled without breaking the suite. For the pure functions it means asserting on returned strings and data structures for known inputs. No test should assert that a particular CSS grid template is in use; the fixed-width rule is verified by the absence of reflow-causing content, not by inspecting stylesheets.

**`MatchScreen`**, at the existing React Testing Library seam, with `MatchScreen.test.tsx` as prior art for the `Match` and `Ply` fixtures. Covers: bot cards rendering name, colour, provider/model and clamped prompt; the prompt expander; captured-piece glyphs and the material badge for a match containing captures; captures tracking the scrub cursor; reasoning rendering in the lanes rather than the cards; streaming reasoning appearing in the streaming side's lane; the speech log present alongside the board; the download buttons and chesstempo link appearing only on a finished match; the analyse button triggering the injected engine and the chart appearing with its points.

**`SetupScreen`**, at the existing seam, with `SetupScreen.test.tsx` as prior art. Covers: the first form identified as White and the second as Black; the randomise toggle defaulting to off; the labels changing when it is enabled; the colour assignment actually passed to `onStart` in both states.

**Pure functions**, following the established style of `buildContext.test.ts`, `scrubCursor.test.ts` and `resolveSan.test.ts`. Covers: capture derivation from a ply list including en passant and promotion; material advantage arithmetic; the Markdown export's ordering and interleaving; the PGN export's tag roster, movetext and comment truncation; and the centipawn conversion — the midpoint mapping to 50, symmetry around it, the side-to-move sign flip, and mate scores resolving to 100 or 0 on the correct side after that flip.

**Analysis driver**, tested against a fake engine supplied through the new interface, in the manner of `providerClients.test.ts`. Covers: points emitted in ply order; the last `info` line per position being the one used; progressive emission as results arrive; and cancellation when the user navigates away mid-analysis. No test starts a real Stockfish worker.

## Out of Scope

- Convex schema changes of any kind. Captured pieces are derived at render time and evaluations are not persisted.
- Caching or sharing analysis results between viewers of the same match.
- Multi-threaded Stockfish and the COOP/COEP headers it would require.
- Refreshing the OpenAI and Gemini curated model lists.
- A rematch-with-colours-swapped action.
- Per-move accuracy grades, blunder/mistake/inaccuracy classification, or opening identification.
- Any change to how bots are prompted, how moves are parsed, or how stumbles are detected.

## Further Notes

The measurement this chart provides is **engine-objective advantage, not practical difficulty**. A position the engine scores at +0.3 can be extremely hard to hold in practice, so the curve will under-report the drama in sharp positions. Worth remembering before treating the line as a judgement on how well a bot played.

The stumble markers are the more novel half of the analysis. Engine evaluation charts are commonplace; a chart showing where a language model failed to produce a legal move, plotted against the point where it lost the game, is not — and it is the comparative data this project already set out to surface.

Depth 12 and the 320px lane height are both starting values chosen for a reason rather than measured. Both are cheap to revisit once there is a real game to look at.
