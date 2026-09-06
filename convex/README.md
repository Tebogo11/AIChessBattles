# Convex backend

`schema.ts`, `matches.ts` and `plies.ts` are the source of truth. The
`_generated/` folder is normally produced by `npx convex dev`; the copies here
are byte-for-byte what codegen emits for this schema so the app type-checks and
builds before a deployment exists. Running `npx convex dev` overwrites them.

## First-time setup (needs a browser login — cannot be automated)

```
npx convex dev
```

This logs you in, provisions a deployment, regenerates `_generated/`, and
prints your deployment URL. Put that URL in `.env`:

```
VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
```

Until then the app runs in local-only mode: a match plays in memory and a
refresh loses it (expected — that is ticket #1 behaviour).
