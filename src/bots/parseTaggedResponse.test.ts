import { describe, expect, it } from "vitest";
import { cleanMoveToken, parseTaggedResponse } from "./parseTaggedResponse";

describe("parseTaggedResponse", () => {
  it("parses a complete reply", () => {
    const r = parseTaggedResponse(
      "<thinking>plan</thinking><speech>hi</speech><move>Nf3</move>",
    );
    expect(r).toEqual({ thinking: "plan", speech: "hi", move: "Nf3" });
  });

  it("handles an empty speech section", () => {
    const r = parseTaggedResponse("<thinking>plan</thinking><speech></speech><move>e4</move>");
    expect(r.speech).toBe("");
    expect(r.move).toBe("e4");
  });

  it("tolerates a partial, still-streaming buffer with an unclosed tag", () => {
    const r = parseTaggedResponse("<thinking>I am still think");
    expect(r.thinking).toBe("I am still think");
    expect(r.move).toBe("");
  });

  it("reads thinking even once the next section has opened", () => {
    const r = parseTaggedResponse("<thinking>done</thinking><speech>talk");
    expect(r.thinking).toBe("done");
    expect(r.speech).toBe("talk");
  });

  it("is case-insensitive about tags", () => {
    const r = parseTaggedResponse("<THINKING>x</THINKING><move>e4</move>");
    expect(r.thinking).toBe("x");
    expect(r.move).toBe("e4");
  });
});

describe("cleanMoveToken", () => {
  it("strips move numbers and punctuation and extra words", () => {
    expect(cleanMoveToken("12. Nf3")).toBe("Nf3");
    expect(cleanMoveToken("e4.")).toBe("e4");
    expect(cleanMoveToken("Nf3 develops")).toBe("Nf3");
  });
});
