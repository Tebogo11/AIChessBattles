import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { outcomeLine, reasoningMarkdown, type ExportInput } from "./exportMarkdown";
import { COMMENT_LIMIT, matchPgn, resultTag, toComment } from "./exportPgn";
import { matchSlug, moveLabel } from "./moveLabel";
import type { Ply, Side } from "./types";

const ply = (over: Partial<Ply> & { index: number }): Ply => ({
  side: (over.index % 2 === 0 ? "w" : "b") as Side,
  san: "e4",
  fenAfter: "",
  thinking: "",
  speech: "",
  stumble: false,
  durationMs: 0,
  ...over,
});

const input = (over: Partial<ExportInput> = {}): ExportInput => ({
  plies: [
    ply({ index: 0, san: "e4", thinking: "Take the centre.", speech: "Here we go." }),
    ply({ index: 1, san: "e5", thinking: "Mirror it." }),
    ply({ index: 2, san: "Nf3", thinking: "Develop with tempo." }),
  ],
  whiteName: "Alice",
  blackName: "Bob",
  result: { winner: "w", reason: "checkmate" },
  ...over,
});

describe("moveLabel", () => {
  it("numbers White with a dot and Black with an ellipsis", () => {
    expect(moveLabel(0)).toBe("1.");
    expect(moveLabel(1)).toBe("1...");
    expect(moveLabel(2)).toBe("2.");
    expect(moveLabel(21)).toBe("11...");
  });
});

describe("matchSlug", () => {
  it("makes a filesystem-safe stem", () => {
    expect(matchSlug("Alice", "Bob")).toBe("alice-vs-bob");
    expect(matchSlug("Dr. Nimzo!", "The  Swindler")).toBe("dr-nimzo-vs-the-swindler");
    expect(matchSlug("", "")).toBe("bot-vs-bot");
  });
});

describe("outcomeLine", () => {
  it("names the winner by bot name", () => {
    expect(outcomeLine(input())).toBe("Checkmate — Alice wins");
    expect(outcomeLine(input({ result: { winner: "b", reason: "checkmate" } }))).toBe(
      "Checkmate — Bob wins",
    );
  });

  it("reports a draw without a winner, and an unfinished game", () => {
    expect(outcomeLine(input({ result: { winner: null, reason: "stalemate" } }))).toBe("Stalemate");
    expect(outcomeLine(input({ result: null }))).toBe("Unfinished");
  });
});

describe("reasoningMarkdown", () => {
  it("interleaves both bots in the order the moves happened", () => {
    const md = reasoningMarkdown(input());
    const order = [
      md.indexOf("Take the centre."),
      md.indexOf("Mirror it."),
      md.indexOf("Develop with tempo."),
    ];
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("heads each move with its number, move, bot and colour", () => {
    const md = reasoningMarkdown(input());
    expect(md).toContain("## 1. e4 — Alice (White)");
    expect(md).toContain("## 1... e5 — Bob (Black)");
    expect(md).toContain("## 2. Nf3 — Alice (White)");
  });

  it("carries the roster and the outcome at the top", () => {
    const md = reasoningMarkdown(input());
    expect(md).toContain("# Alice vs Bob");
    expect(md).toContain("- **White:** Alice");
    expect(md).toContain("- **Black:** Bob");
    expect(md).toContain("- **Result:** Checkmate — Alice wins");
  });

  it("quotes speech and flags stumbles", () => {
    const md = reasoningMarkdown(
      input({ plies: [ply({ index: 0, san: "a3", stumble: true, speech: "Oops." })] }),
    );
    expect(md).toContain("> Oops.");
    expect(md).toMatch(/_Stumble/);
    expect(md).toContain("_No reasoning recorded._");
  });

  it("still produces a document for a match with no moves", () => {
    const md = reasoningMarkdown(input({ plies: [] }));
    expect(md).toContain("_No moves were played._");
  });
});

describe("resultTag", () => {
  it("uses the standard result strings", () => {
    expect(resultTag({ winner: "w", reason: "checkmate" })).toBe("1-0");
    expect(resultTag({ winner: "b", reason: "checkmate" })).toBe("0-1");
    expect(resultTag({ winner: null, reason: "move-cap" })).toBe("1/2-1/2");
    expect(resultTag(null)).toBe("*");
  });
});

describe("toComment", () => {
  it("flattens whitespace and strips braces PGN cannot escape", () => {
    expect(toComment("keep  it {tight}\nand low")).toBe("keep it tight and low");
  });

  it("truncates long reasoning with an ellipsis", () => {
    const comment = toComment("x".repeat(400));
    expect(comment.length).toBe(COMMENT_LIMIT);
    expect(comment.endsWith("…")).toBe(true);
  });

  it("leaves reasoning at the limit alone", () => {
    const exact = "y".repeat(COMMENT_LIMIT);
    expect(toComment(exact)).toBe(exact);
  });
});

describe("matchPgn", () => {
  const pgn = matchPgn(input(), new Date(2026, 8, 7));

  it("writes the seven-tag roster with the bots as the players", () => {
    expect(pgn).toContain('[Event "AI Chess Battles"]');
    expect(pgn).toContain('[Site "AI Chess Battles"]');
    expect(pgn).toContain('[Date "2026.09.07"]');
    expect(pgn).toContain('[Round "-"]');
    expect(pgn).toContain('[White "Alice"]');
    expect(pgn).toContain('[Black "Bob"]');
    expect(pgn).toContain('[Result "1-0"]');
  });

  it("writes the movetext with each bot's reasoning as a comment", () => {
    expect(pgn).toContain("1. e4");
    expect(pgn).toContain("{Take the centre.}");
    expect(pgn).toContain("{Mirror it.}");
    expect(pgn).toContain("{Develop with tempo.}");
  });

  it("marks a stumble inside the comment", () => {
    const marked = matchPgn(
      input({ plies: [ply({ index: 0, san: "a3", stumble: true, thinking: "lost the thread" })] }),
    );
    expect(marked).toContain("{stumble: lost the thread}");
  });

  it("reads back into the same game, which is the whole point of exporting it", () => {
    const reloaded = new Chess();
    reloaded.loadPgn(pgn);
    expect(reloaded.history()).toEqual(["e4", "e5", "Nf3"]);
    expect(reloaded.getHeaders().White).toBe("Alice");
    expect(reloaded.getHeaders().Black).toBe("Bob");
    expect(reloaded.getHeaders().Result).toBe("1-0");
  });
});
