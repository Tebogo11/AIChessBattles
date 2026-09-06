# 06: Ollama plays the game

**What to build:** Replace the random-move bots with a local model. Each turn, a bot is given the current position, the game so far, the list of legal moves, its own recent reasoning and the persona instructions, and it returns a move that gets played. Both sides run on Ollama.

Reasoning and speech are captured and stored per move but not yet streamed to the screen — that is 07. This ticket is about getting a valid, sensible move out of a model and into the game.

The bot is given the **full list of legal moves** to choose from. Models are poor at deriving legality from raw board state, and small local ones are bad enough at it to make the app unusable; choosing well from ~30 options is still a genuine test of chess understanding (SPEC §4.1).

Responses come back as tagged sections in a fixed order — thinking, then speech, then move — rather than JSON, because tags survive streaming and small models mangle them far less often (SPEC §4.2).

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] A single model interface that later providers can implement, with an Ollama implementation behind it
- [ ] Each turn sends position, move history, legal move list, the bot's own reasoning from roughly the last 6 plies, and the full speech log (SPEC §4.1)
- [ ] Tagged-section responses are parsed into thinking, speech and move
- [ ] Reasoning and speech are stored on the ply alongside the move
- [ ] A full match runs from opening to termination with both bots on Ollama
- [ ] Prompt assembly lives in one place, ready for the exclusion rule in 09
