import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Two tables, deliberately not one document. A full match reaches low hundreds
 * of KB; a reactive query on one growing document re-pushes the whole match on
 * every ply. Separate ply rows let the client subscribe to a range. (SPEC §7)
 */

/** The frozen persona synthesised at match start (SPEC §6). */
const persona = v.object({
  name: v.string(),
  traits: v.array(v.string()),
  openingPreference: v.string(),
  riskTolerance: v.string(),
  speechRegister: v.string(),
  catchphrases: v.array(v.string()),
  systemPrompt: v.string(),
});

/** Provider + model for one bot. Keys never live here — inference is client-side. */
const botConfig = v.object({
  name: v.string(),
  /** Raw user prompt, before persona synthesis. */
  prompt: v.string(),
  provider: v.union(
    v.literal("random"),
    v.literal("ollama"),
    v.literal("openai"),
    v.literal("gemini"),
    v.literal("anthropic"),
  ),
  model: v.string(),
  /** Frozen persona, absent when synthesis was skipped or failed (SPEC §6). */
  persona: v.optional(persona),
});

export default defineSchema({
  matches: defineTable({
    white: botConfig,
    black: botConfig,
    status: v.union(
      v.literal("running"),
      v.literal("stalled"),
      v.literal("finished"),
    ),
    /** Winner side, or null for a draw / unfinished. */
    winner: v.union(v.literal("w"), v.literal("b"), v.null()),
    terminationReason: v.union(
      v.literal("checkmate"),
      v.literal("stalemate"),
      v.literal("threefold-repetition"),
      v.literal("fifty-move-rule"),
      v.literal("insufficient-material"),
      v.literal("move-cap"),
      v.null(),
    ),
    /** True for curated landing-page replays (SPEC §10). */
    seeded: v.boolean(),
    /** Last time a ply was written; used to decide staleness on resume. */
    lastActivityAt: v.number(),
  }).index("by_seeded", ["seeded"]),

  plies: defineTable({
    matchId: v.id("matches"),
    /** 0-based position in the match. */
    index: v.number(),
    side: v.union(v.literal("w"), v.literal("b")),
    san: v.string(),
    fenAfter: v.string(),
    thinking: v.string(),
    speech: v.string(),
    stumble: v.boolean(),
    durationMs: v.number(),
  })
    // Range subscription per match, ordered by ply index.
    .index("by_match", ["matchId", "index"]),
});
