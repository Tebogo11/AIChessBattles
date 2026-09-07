import type { BotConfig } from "../game/botConfig";
import type { ChatClient } from "./chatClient";
import { GeminiChatClient } from "./geminiClient";
import { getKey } from "./keyStore";
import { createModelBot } from "./modelBot";
import { OllamaChatClient } from "./ollamaClient";
import { OpenAIChatClient } from "./openaiClient";
import { createRandomBot } from "./randomBot";
import type { ChessBot } from "./types";

/**
 * A raw streaming client for a config, or null when the provider has no model to
 * call (random). Keys are read from the browser key store here, not stored on
 * the config, so a key never travels through Convex (SPEC §9.3). Used by both
 * persona synthesis (#9) and the bot-playing path.
 */
export function clientFromConfig(config: BotConfig): ChatClient | null {
  switch (config.provider) {
    case "ollama":
      return new OllamaChatClient(config.model);
    case "openai":
      return new OpenAIChatClient(config.model, getKey("openai"));
    case "gemini":
      return new GeminiChatClient(config.model, getKey("gemini"));
    default:
      return null; // random has no model to call.
  }
}

/**
 * Turn a stored bot config into a playable bot. Every provider is behind the
 * same interface, so a mixed matchup (GPT vs Gemini vs a local Llama) just works
 * (SPEC §11). The bot runs on the persona's system prompt when synthesis
 * produced one, else the raw prompt (SPEC §6).
 */
export function botFromConfig(config: BotConfig): ChessBot {
  const name = config.persona?.name || config.name || config.provider;
  const client = clientFromConfig(config);
  if (client) return createModelBot(name, client);
  // No model to call (random) → the random mover keeps a match running.
  return createRandomBot(name);
}
