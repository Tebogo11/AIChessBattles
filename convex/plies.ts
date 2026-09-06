import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * The client subscribes to this per match; a new ply re-pushes only the range
 * it asks for, not the whole game (SPEC §7).
 */
export const list = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) =>
    ctx.db
      .query("plies")
      .withIndex("by_match", (q) => q.eq("matchId", matchId))
      .collect(),
});

/**
 * Append one ply. Idempotent on (matchId, index): if the tab died mid-write and
 * the move is regenerated, re-appending the same index is a no-op rather than a
 * duplicate (SPEC §8).
 */
export const append = mutation({
  args: {
    matchId: v.id("matches"),
    index: v.number(),
    side: v.union(v.literal("w"), v.literal("b")),
    san: v.string(),
    fenAfter: v.string(),
    thinking: v.string(),
    speech: v.string(),
    stumble: v.boolean(),
    durationMs: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("plies")
      .withIndex("by_match", (q) =>
        q.eq("matchId", args.matchId).eq("index", args.index),
      )
      .unique();
    if (existing) return existing._id;

    const id = await ctx.db.insert("plies", args);
    await ctx.db.patch(args.matchId, { lastActivityAt: Date.now() });
    return id;
  },
});
