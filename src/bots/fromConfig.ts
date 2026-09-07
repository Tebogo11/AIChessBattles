import type { BotConfig } from "../game/botConfig";
import type { ChatClient } from "./chatClient";
import { createModelBot } from "./modelBot";
import { OllamaChatClient } from "./ollamaClient";
import { createRandomBot } from "./randomBot";
import type { ChessBot } from "./types";

/**
 * A raw streaming client for a config, or null when the provider has no model to
 * call (random). Used by persona synthesis (#9); the bot-playing path goes
 * through {@link botFromConfig}.
 */
export function clientFromConfig(config: BotConfig): ChatClient | null {
  switch (config.provider) {
    case "ollama":
      return new OllamaChatClient(config.model);
    default:
      return null; // random today; openai/gemini arrive in #11.
  }
}

/**
 * Turn a stored bot config into a playable bot. Random and Ollama exist today;
 * OpenAI and Gemini slot in here behind the same interface in #11, so nothing
 * upstream changes when they arrive (SPEC §11). The bot runs on the persona's
 * system prompt when synthesis produced one, else the raw prompt (SPEC §6).
 */
export function botFromConfig(config: BotConfig): ChessBot {
  const name = config.persona?.name || config.name || config.provider;
  const client = clientFromConfig(config);
  if (client) return createModelBot(name, client);
  // No model to call → the random mover keeps a match running (SPEC §11).
  return createRandomBot(name);
}
