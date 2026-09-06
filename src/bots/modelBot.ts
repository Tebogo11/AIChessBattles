import { parseTaggedResponse } from "./parseTaggedResponse";
import { assembleMessages, correctionMessage, type ChatMessage } from "./promptAssembly";
import { randomLegalMove, resolveSan } from "./resolveSan";
import type { ChatClient } from "./chatClient";
import type { BotContext, BotDecision, ChessBot, DecideOptions } from "./types";

/** Attempts before giving up and playing a random legal move (SPEC §4.4). */
export const MAX_ATTEMPTS = 3;

async function collect(
  client: ChatClient,
  messages: ChatMessage[],
  opts: DecideOptions | undefined,
): Promise<string> {
  let buffer = "";
  for await (const delta of client.stream(messages, opts?.signal)) {
    buffer += delta;
    opts?.onDelta?.(buffer);
  }
  return buffer;
}

/**
 * A model-backed bot. The parse / validate / retry / stumble loop is
 * provider-agnostic: it drives any {@link ChatClient}. A move not in the legal
 * list, or an unparseable reply, is retried with a correction up to three times;
 * on the third failure a random legal move is played and logged as a stumble, so
 * a model is never forfeited for a formatting mistake (SPEC §4.2, §4.4).
 */
export function createModelBot(name: string, client: ChatClient): ChessBot {
  return {
    name,
    async decide(ctx: BotContext, opts?: DecideOptions): Promise<BotDecision> {
      const messages = assembleMessages(ctx);
      let lastThinking = "";
      let lastSpeech = "";

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const raw = await collect(client, messages, opts);
        const parsed = parseTaggedResponse(raw);
        if (parsed.thinking) lastThinking = parsed.thinking;
        if (parsed.speech) lastSpeech = parsed.speech;

        const san = resolveSan(parsed.move, ctx.legalMoves);
        if (san) {
          return { san, thinking: parsed.thinking, speech: parsed.speech, stumble: false };
        }

        // Feed the model its own reply plus a correction, then try again.
        messages.push({ role: "assistant", content: raw });
        messages.push(correctionMessage(parsed.move, ctx.legalMoves));
      }

      // Out of attempts: play a random legal move, flagged as a stumble.
      return {
        san: randomLegalMove(ctx.legalMoves),
        thinking: lastThinking,
        speech: lastSpeech,
        stumble: true,
      };
    },
  };
}
