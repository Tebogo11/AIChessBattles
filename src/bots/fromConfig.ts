import type { BotConfig } from "../game/botConfig";
import { createRandomBot } from "./randomBot";
import type { ChessBot } from "./types";

/**
 * Turn a stored bot config into a playable bot. Only the random mover exists in
 * milestone 1; real providers slot in here behind the same interface, so
 * nothing upstream changes when they arrive (SPEC §11).
 */
export function botFromConfig(config: BotConfig): ChessBot {
  switch (config.provider) {
    case "random":
      return createRandomBot(config.name || "Random");
    default:
      // Ollama / OpenAI / Gemini land in later tickets. Until then, don't wedge
      // a persisted match: fall back to a random mover under the same name.
      return createRandomBot(config.name || config.provider);
  }
}
