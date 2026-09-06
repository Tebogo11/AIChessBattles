# 01: Random self-playing board

**What to build:** A page you can open and watch a full chess game play itself. Two bots pick random legal moves. The game autoplays, can be paused, and can be stepped forward one move at a time. Every way a real game ends is detected and announced. All state lives in memory — no backend, no AI.

This is the skeleton every later ticket hangs off, and it iterates instantly because nothing waits on a model.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] React + Vite app runs locally and renders a chessboard
- [ ] Two random-move bots alternate turns until the game ends
- [ ] Autoplay runs continuously; pause stops it; step advances exactly one ply while paused
- [ ] Checkmate, stalemate, threefold repetition, fifty-move rule and insufficient material all end the match with the reason shown
- [ ] A 150-move cap ends the match as an adjudicated draw (SPEC §4.5)
- [ ] Refreshing loses the match — expected at this stage
