import { ProviderError } from "./chatClient";
import { parseTaggedResponse } from "./parseTaggedResponse";
import { assembleMessages, correctionMessage, type ChatMessage } from "./promptAssembly";
import { randomLegalMove, resolveSan } from "./resolveSan";
import type { ChatClient } from "./chatClient";
import type { BotContext, BotDecision, ChessBot, DecideOptions } from "./types";

/** Move-correction attempts before playing a random legal move (SPEC §4.4). */
export const MAX_ATTEMPTS = 3;
/** Provider-error attempts (rate limit, network drop) before giving up (SPEC §8). */
export const PROVIDER_ATTEMPTS = 3;

export interface ModelBotOptions {
  /** Base backoff in ms; the nth retry waits base * 2^n. Overridable for tests. */
  backoffBaseMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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
 * One reply, retrying *provider* failures (network, rate limit, HTTP error) with
 * exponential backoff. A provider error is distinct from a bad move: it means we
 * never heard back, so there is nothing to correct — we simply try again, and
 * after the last attempt the error propagates so the match can stall with the
 * provider's verbatim text (SPEC §8). Never falls back to another provider.
 */
async function collectWithBackoff(
  client: ChatClient,
  messages: ChatMessage[],
  opts: DecideOptions | undefined,
  cfg: Required<ModelBotOptions>,
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < PROVIDER_ATTEMPTS; attempt++) {
    try {
      return await collect(client, messages, opts);
    } catch (err) {
      if (!(err instanceof ProviderError)) throw err;
      lastErr = err;
      if (attempt < PROVIDER_ATTEMPTS - 1) {
        await cfg.sleep(cfg.backoffBaseMs * 2 ** attempt);
      }
    }
  }
  throw lastErr;
}

/**
 * A model-backed bot. The parse / validate / retry / stumble loop is
 * provider-agnostic: it drives any {@link ChatClient}. A move not in the legal
 * list, or an unparseable reply, is retried with a correction up to three times;
 * on the third failure a random legal move is played and logged as a stumble, so
 * a model is never forfeited for a formatting mistake (SPEC §4.2, §4.4). A
 * provider failure is handled separately: retried with backoff, then thrown so
 * the match stalls rather than silently swapping models (SPEC §8).
 */
export function createModelBot(name: string, client: ChatClient, options?: ModelBotOptions): ChessBot {
  const cfg: Required<ModelBotOptions> = {
    backoffBaseMs: options?.backoffBaseMs ?? 500,
    sleep: options?.sleep ?? defaultSleep,
  };

  return {
    name,
    async decide(ctx: BotContext, opts?: DecideOptions): Promise<BotDecision> {
      const messages = assembleMessages(ctx);
      let lastThinking = "";
      let lastSpeech = "";

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const raw = await collectWithBackoff(client, messages, opts, cfg);
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

      // Out of move attempts: play a random legal move, flagged as a stumble.
      return {
        san: randomLegalMove(ctx.legalMoves),
        thinking: lastThinking,
        speech: lastSpeech,
        stumble: true,
      };
    },
  };
}
