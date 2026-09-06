import type { BotContext } from "./types";

/** A provider-agnostic chat message. Adapters map this to their own shape. */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * The single place a bot's context is turned into messages. Everything a bot may
 * see is assembled here — its own reasoning and both speech logs — and, by
 * construction, the opponent's reasoning is never included. #9's hidden-thoughts
 * rule lives here rather than being scattered across adapters (SPEC §4.1, §7).
 */
export function assembleMessages(ctx: BotContext): ChatMessage[] {
  const colour = ctx.side === "w" ? "White" : "Black";

  const speech =
    ctx.speechLog.length === 0
      ? "(no one has spoken yet)"
      : ctx.speechLog.map((s) => `${s.name} (${s.side === "w" ? "White" : "Black"}): ${s.text}`).join("\n");

  const ownReasoning =
    ctx.ownRecentReasoning.length === 0
      ? "(none yet)"
      : ctx.ownRecentReasoning.map((r) => `- ${r}`).join("\n");

  const user = [
    `You are playing ${colour}.`,
    ``,
    `Position (FEN): ${ctx.fen}`,
    `Moves so far: ${ctx.history.length ? ctx.history.join(" ") : "(none — the game is starting)"}`,
    ``,
    `You must choose exactly one move from this list of legal moves:`,
    ctx.legalMoves.join(", "),
    ``,
    `Your own recent private thoughts:`,
    ownReasoning,
    ``,
    `The table talk so far (both players can read this):`,
    speech,
    ``,
    `Reply with exactly these three tagged sections, in this order:`,
    `<thinking>your private reasoning — the opponent never sees this</thinking>`,
    `<speech>something to say to your opponent, or leave empty if you have nothing worth saying</speech>`,
    `<move>a single move copied exactly from the legal move list above</move>`,
  ].join("\n");

  return [
    { role: "system", content: ctx.systemPrompt || `You are ${colour}, a chess-playing persona.` },
    { role: "user", content: user },
  ];
}

/** The correction message sent after an illegal or unparseable move (SPEC §4.4). */
export function correctionMessage(badMove: string, legalMoves: string[]): ChatMessage {
  return {
    role: "user",
    content: [
      badMove
        ? `"${badMove}" is not a legal move here.`
        : `I could not find a <move> in your reply.`,
      `Choose exactly one move, copied verbatim, from this list:`,
      legalMoves.join(", "),
      `Reply again with the three tagged sections; the <move> must be one of the above.`,
    ].join("\n"),
  };
}
