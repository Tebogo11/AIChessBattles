import type { Persona } from "./persona";

/** Provider identifiers, shared with the Convex schema. */
export type Provider = "random" | "ollama" | "openai" | "gemini";

/**
 * A bot as configured on the setup screen and stored on the match. Keys are
 * never part of this — inference is client-side (SPEC §2, §9.3). The persona, if
 * synthesis succeeded, is frozen here for the whole match (SPEC §6).
 */
export interface BotConfig {
  name: string;
  /** Raw user prompt, before persona synthesis. */
  prompt: string;
  provider: Provider;
  model: string;
  /** The synthesised persona, or absent when synthesis was skipped or failed. */
  persona?: Persona;
}

/** The instructions a bot actually runs on: its persona's prompt, or the raw one. */
export function systemPromptFor(config: BotConfig): string {
  return config.persona?.systemPrompt ?? config.prompt;
}

/** Milestone-1 default: two random movers. */
export const RANDOM_MATCHUP: { white: BotConfig; black: BotConfig } = {
  white: { name: "White (random)", prompt: "", provider: "random", model: "" },
  black: { name: "Black (random)", prompt: "", provider: "random", model: "" },
};
