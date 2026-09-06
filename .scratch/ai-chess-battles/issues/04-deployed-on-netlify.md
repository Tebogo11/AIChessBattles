# 04: Deployed on Netlify with working deep links

**What to build:** A real public URL where a stranger can open the app and watch a match. Deployed early and deliberately — the point is to hit hosting problems now, while the app is still a random-move board, rather than discovering them at the end with AI and personas in the way.

The specific risk being retired: a Vite SPA on Netlify returns a 404 for client-routed URLs unless a catch-all redirect is configured. That would break shared replay links — the single most important path in the product (SPEC §10, §12) — and it fails invisibly, because clicking through the app from the home page never exercises it.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Netlify site builds and serves the app from a stable public URL
- [ ] Convex production deployment is separate from dev and the deployed app talks to it
- [ ] Catch-all SPA redirect configured so client-routed paths resolve (SPEC §3)
- [ ] **Opening a match URL directly in a fresh tab loads the match** — verified by pasting the URL, not by navigating within the app
- [ ] Someone on another machine can open the link and watch a match play out
