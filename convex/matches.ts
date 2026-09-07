import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const persona = v.object({
  name: v.string(),
  traits: v.array(v.string()),
  openingPreference: v.string(),
  riskTolerance: v.string(),
  speechRegister: v.string(),
  catchphrases: v.array(v.string()),
  systemPrompt: v.string(),
});

const botConfig = v.object({
  name: v.string(),
  prompt: v.string(),
  provider: v.union(
    v.literal("random"),
    v.literal("ollama"),
    v.literal("openai"),
    v.literal("gemini"),
  ),
  model: v.string(),
  persona: v.optional(persona),
});

/** Start a match. Returns the id that becomes the match URL. */
export const create = mutation({
  args: { white: botConfig, black: botConfig, seeded: v.optional(v.boolean()) },
  handler: async (ctx, { white, black, seeded }) => {
    return await ctx.db.insert("matches", {
      white,
      black,
      status: "running",
      winner: null,
      terminationReason: null,
      seeded: seeded ?? false,
      lastActivityAt: Date.now(),
    });
  },
});

export const get = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => ctx.db.get(matchId),
});

/** Curated seeded matches for the landing gallery (SPEC §10). */
export const listSeeded = query({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("matches")
      .withIndex("by_seeded", (q) => q.eq("seeded", true))
      .collect(),
});

export const finish = mutation({
  args: {
    matchId: v.id("matches"),
    winner: v.union(v.literal("w"), v.literal("b"), v.null()),
    terminationReason: v.union(
      v.literal("checkmate"),
      v.literal("stalemate"),
      v.literal("threefold-repetition"),
      v.literal("fifty-move-rule"),
      v.literal("insufficient-material"),
      v.literal("move-cap"),
    ),
  },
  handler: async (ctx, { matchId, winner, terminationReason }) => {
    await ctx.db.patch(matchId, {
      status: "finished",
      winner,
      terminationReason,
      lastActivityAt: Date.now(),
    });
  },
});

/**
 * A live match whose tab went away is marked stalled, not left "running", so
 * reopening it can offer Resume rather than a dead game (SPEC §8).
 */
export const markStalled = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const match = await ctx.db.get(matchId);
    if (match && match.status === "running") {
      await ctx.db.patch(matchId, { status: "stalled" });
    }
  },
});

/** Resume a stalled match — flip it back to running before play continues. */
export const resume = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const match = await ctx.db.get(matchId);
    if (match && match.status === "stalled") {
      await ctx.db.patch(matchId, { status: "running", lastActivityAt: Date.now() });
    }
  },
});
