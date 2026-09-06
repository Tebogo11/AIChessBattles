/** Provider identifiers, shared with the Convex schema. */
export type Provider = "random" | "ollama" | "openai" | "gemini";

/**
 * A bot as configured on the setup screen and stored on the match. Keys are
 * never part of this — inference is client-side (SPEC §2, §9.3).
 */
export interface BotConfig {
  name: string;
  /** Raw user prompt, before persona synthesis. */
  prompt: string;
  provider: Provider;
  model: string;
}

/** Milestone-1 default: two random movers. */
export const RANDOM_MATCHUP: { white: BotConfig; black: BotConfig } = {
  white: { name: "White (random)", prompt: "", provider: "random", model: "" },
  black: { name: "Black (random)", prompt: "", provider: "random", model: "" },
};
