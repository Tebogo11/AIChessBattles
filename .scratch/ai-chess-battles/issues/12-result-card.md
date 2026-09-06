# 12: Result card

**What to build:** What happens the moment checkmate lands. The board freezes and a result card appears: who won, how it ended, how many moves it took, and **how many times each bot stumbled**.

The stumble count is the payoff of 08 and the most interesting number in the app — it is comparative data about the models that no other chess demo surfaces.

Two actions: *Rematch same config* — same personas, same models, different game, which is the natural second thing anyone wants — and *Edit prompts*. Plus a share link. No auto-redirect to a replay view; the user just watched a game end and needs a beat (SPEC §9.4).

**Blocked by:** 05, 08

**Status:** ready-for-agent

- [ ] Result card appears on any termination, including the 150-move cap
- [ ] Shows winner, termination reason, move count, and stumble count per bot
- [ ] Share link copies a URL that opens the finished match for someone else
- [ ] Rematch starts a new match with identical personas, models and settings
- [ ] Edit prompts returns to setup pre-filled with what was used
- [ ] Nothing auto-navigates away when the match ends
