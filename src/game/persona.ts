/**
 * A persona is the frozen result of one synthesis call at match start: the raw
 * user prompt turned into a structured profile, rendered into a system prompt
 * that is fixed for the whole match (SPEC §6). It is stored on the match so a
 * replay shows the persona that actually played.
 */
export interface Persona {
  name: string;
  traits: string[];
  openingPreference: string;
  riskTolerance: string;
  speechRegister: string;
  catchphrases: string[];
  /** The system prompt rendered from the profile — what the bot actually runs on. */
  systemPrompt: string;
}

/** The raw user prompt this persona was synthesised from, kept for the card + fallback. */
export interface PersonaResult {
  persona: Persona | null;
  rawPrompt: string;
  name: string;
}
