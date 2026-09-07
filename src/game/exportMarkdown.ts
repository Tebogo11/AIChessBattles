import { moveLabel } from "./moveLabel";
import { TERMINATION_LABEL } from "./types";
import type { MatchResult, Ply } from "./types";

export interface ExportInput {
  plies: Ply[];
  whiteName: string;
  blackName: string;
  result: MatchResult | null;
}

/** The outcome as one human sentence, or a note that the game is unfinished. */
export function outcomeLine(input: ExportInput): string {
  const { result, whiteName, blackName } = input;
  if (!result) return "Unfinished";
  const label = TERMINATION_LABEL[result.reason];
  if (!result.winner) return label;
  return `${label} — ${result.winner === "w" ? whiteName : blackName} wins`;
}

/**
 * Both bots' reasoning as one Markdown document, in the order it happened.
 * Interleaved rather than split per bot: the point of reading it back is
 * watching two lines of thought answer each other, which two separate lists
 * destroy (#15).
 */
export function reasoningMarkdown(input: ExportInput): string {
  const { plies, whiteName, blackName } = input;
  const nameFor = (side: "w" | "b") => (side === "w" ? whiteName : blackName);

  const lines: string[] = [
    `# ${whiteName} vs ${blackName}`,
    "",
    `- **White:** ${whiteName}`,
    `- **Black:** ${blackName}`,
    `- **Moves:** ${Math.ceil(plies.length / 2)}`,
    `- **Result:** ${outcomeLine(input)}`,
    "",
  ];

  if (plies.length === 0) {
    lines.push("_No moves were played._", "");
    return lines.join("\n");
  }

  for (const ply of plies) {
    const colour = ply.side === "w" ? "White" : "Black";
    lines.push(`## ${moveLabel(ply.index)} ${ply.san} — ${nameFor(ply.side)} (${colour})`, "");
    if (ply.stumble) {
      lines.push("_Stumble: no legal move was parsed from the reply, so one was picked._", "");
    }
    lines.push(ply.thinking.trim() || "_No reasoning recorded._", "");
    if (ply.speech.trim()) lines.push(`> ${ply.speech.trim()}`, "");
  }

  return lines.join("\n");
}
