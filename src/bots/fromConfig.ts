import type { BotConfig } from "../game/botConfig";
import { createOllamaBot } from "./ollamaClient";
import { createRandomBot } from "./randomBot";
import type { ChessBot } from "./types";

/**
 * Turn a stored bot config into a playable bot. Random and Ollama exist today;
 * OpenAI and Gemini slot in here behind the same interface in #11, so nothing
 * upstream changes when they arrive (SPEC §11).
 */
export function botFromConfig(config: BotConfig): ChessBot {
  const name = config.name || config.provider;
  switch (config.provider) {
    case "ollama":
      return createOllamaBot(name, config.model);
    case "random":
      return createRandomBot(name);
    default:
      // OpenAI / Gemini land in #11. Until then, don't wedge a persisted match:
      // fall back to a random mover under the same name.
      return createRandomBot(name);
  }
}
