# 08: It survives things going wrong

**What to build:** Two different failures, handled differently.

**The bot produces a bad move** — illegal, or unparseable output. It gets told and retried up to three times. If it still can't produce a valid move, a random legal move is played for it and the match continues, with the incident shown in that bot's panel as a *stumble*. Forfeiting on a parse error would punish a model for formatting rather than for chess, and stumble counts turn out to be the most interesting comparative data the app produces (SPEC §4.4).

**The provider fails** — rate limit, expired key, network drop at move 40. Three retries with exponential backoff, then the match goes `stalled` with the provider's own error text shown and a Resume button. Never silently switch to a different model to keep going: that destroys the one thing the app measures (SPEC §8).

**Blocked by:** 03, 06

**Status:** ready-for-agent

- [ ] Invalid or unparseable moves are retried up to 3 times with corrective feedback
- [ ] After 3 failures a random legal move is played and the ply is flagged as a stumble
- [ ] Stumbles are visible in the bot's panel at the moment they happen
- [ ] Provider errors retry 3 times with exponential backoff
- [ ] After that the match is marked `stalled` and shows the provider's verbatim error text
- [ ] A stalled match can be resumed via the mechanism from 03
- [ ] No code path substitutes a different provider or model mid-match
