import { clientFromConfig } from "../bots/fromConfig";
import { synthesizePersona } from "../bots/synthesizePersona";
import type { BotConfig } from "./botConfig";

/**
 * Synthesise a persona for each bot from its raw prompt, in parallel. A bot with
 * no model to call (random), or whose synthesis fails, simply keeps no persona
 * and falls back to its raw prompt — the match is never blocked (SPEC §6).
 */
export async function synthesizeMatchup(
  white: BotConfig,
  black: BotConfig,
): Promise<{ white: BotConfig; black: BotConfig }> {
  const withPersona = async (config: BotConfig): Promise<BotConfig> => {
    const client = clientFromConfig(config);
    if (!client || !config.prompt.trim()) return config;
    const persona = await synthesizePersona(client, config.prompt);
    return persona ? { ...config, persona } : config;
  };

  const [w, b] = await Promise.all([withPersona(white), withPersona(black)]);
  return { white: w, black: b };
}
