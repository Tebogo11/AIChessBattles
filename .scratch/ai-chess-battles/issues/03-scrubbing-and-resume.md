# 03: Scrubbing and resume

**What to build:** The user can rewind to look at an earlier position without destroying anything, then jump back to the live game. And if the tab is closed mid-match, reopening the match URL offers to pick up where it left off rather than presenting a dead game.

The back arrow moves a *view cursor* over the stored history. It never truncates the match or causes a move to be reconsidered (SPEC §5).

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Back and forward move a view cursor over stored history; the board shows the position at that point
- [ ] Returning to live resumes normal display; the underlying match was never modified
- [ ] Scrubbing a finished match works identically to scrubbing a live one — one player component serves both
- [ ] Closing the tab mid-match leaves the match marked `stalled`, not "running"
- [ ] Reopening a `stalled` match offers Resume and continues from the last stored move
- [ ] A move in flight when the tab died is simply regenerated; nothing is corrupted or duplicated
