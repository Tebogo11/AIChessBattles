import type { Persona } from "../game/persona";
import type { ChatClient } from "./chatClient";
import type { ChatMessage } from "./promptAssembly";

/**
 * One synthesis call: turn a raw prompt into a structured persona. Draws only on
 * what the model already knows — no web research, which would add 10–30s of
 * startup latency and break when sites change (SPEC §6). Returns null on failure
 * or an unknown subject, so the caller can fall back to the raw prompt and never
 * block the match.
 */
const FIELDS = ["name", "traits", "opening", "risk", "register", "catchphrases"] as const;

function synthesisMessages(rawPrompt: string): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You turn a short brief into a chess-playing persona, drawing only on what you already know. Do not invent facts you are unsure of. Answer only with the tagged fields requested.",
    },
    {
      role: "user",
      content: [
        `Brief: ${rawPrompt}`,
        ``,
        `Produce this persona as tagged fields, each on its own line:`,
        `<name>a short display name</name>`,
        `<traits>3-5 comma-separated personality/playing traits</traits>`,
        `<opening>their opening preference in a few words</opening>`,
        `<risk>their risk tolerance in a few words</risk>`,
        `<register>how they speak — tone and formality</register>`,
        `<catchphrases>one or two things they might say, comma-separated</catchphrases>`,
      ].join("\n"),
    },
  ];
}

function tag(buffer: string, name: string): string {
  // The `s` (dotAll) flag lets `.` span newlines; note `[\s\S]` in a template
  // literal collapses to `[sS]`, which is why the flag is used instead.
  const m = new RegExp(`<${name}>(.*?)</${name}>`, "is").exec(buffer);
  return m ? m[1].trim() : "";
}

function splitList(s: string): string[] {
  return s
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Render a profile into the system prompt the bot runs on for the whole match. */
export function renderPersonaPrompt(p: Omit<Persona, "systemPrompt">): string {
  return [
    `You are ${p.name}, playing a game of chess in character.`,
    p.traits.length ? `Your character: ${p.traits.join(", ")}.` : "",
    p.openingPreference ? `Openings: ${p.openingPreference}.` : "",
    p.riskTolerance ? `Risk: ${p.riskTolerance}.` : "",
    p.speechRegister ? `When you speak, your register is: ${p.speechRegister}.` : "",
    p.catchphrases.length ? `You might say things like: ${p.catchphrases.join("; ")}.` : "",
    `Stay in character in both your private thinking and your public speech.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function synthesizePersona(
  client: ChatClient,
  rawPrompt: string,
): Promise<Persona | null> {
  let buffer = "";
  try {
    for await (const delta of client.stream(synthesisMessages(rawPrompt))) buffer += delta;
  } catch {
    return null; // Provider failure during synthesis → silent fallback (SPEC §6).
  }

  const name = tag(buffer, "name");
  if (!name) return null; // No usable profile → fall back to the raw prompt.

  const profile = {
    name,
    traits: splitList(tag(buffer, "traits")),
    openingPreference: tag(buffer, "opening"),
    riskTolerance: tag(buffer, "risk"),
    speechRegister: tag(buffer, "register"),
    catchphrases: splitList(tag(buffer, "catchphrases")),
  };
  return { ...profile, systemPrompt: renderPersonaPrompt(profile) };
}

export { FIELDS as PERSONA_FIELDS };
