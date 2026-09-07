import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Ply } from "../game/types";
import { SpeechLog } from "./SpeechLog";

const ply = (over: Partial<Ply>): Ply => ({
  index: 0,
  side: "w",
  san: "e4",
  fenAfter: "",
  thinking: "",
  speech: "",
  stumble: false,
  durationMs: 0,
  ...over,
});

const plies = [
  ply({ index: 0, side: "w", speech: "Your move." }),
  ply({ index: 1, side: "b", speech: "" }), // silence
  ply({ index: 2, side: "w", speech: "Still waiting." }),
  ply({ index: 3, side: "b", speech: "Patience." }),
];

describe("SpeechLog", () => {
  it("interleaves both bots in time order and omits silent plies", () => {
    render(
      <SpeechLog plies={plies} whiteName="Alice" blackName="Bob" cutoff={null} streaming={null} />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3); // the empty one is dropped
    expect(within(items[0]).getByText("Your move.")).toBeInTheDocument();
    expect(within(items[2]).getByText("Patience.")).toBeInTheDocument();
  });

  it("shows only speech up to the scrub cutoff", () => {
    render(
      <SpeechLog plies={plies} whiteName="Alice" blackName="Bob" cutoff={0} streaming={null} />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Your move.")).toBeInTheDocument();
    expect(screen.queryByText("Patience.")).not.toBeInTheDocument();
  });

  it("shows a pending line for in-flight speech only when live", () => {
    const { rerender } = render(
      <SpeechLog
        plies={[]}
        whiteName="Alice"
        blackName="Bob"
        cutoff={null}
        streaming={{ side: "w", thinking: "", speech: "Hah!" }}
      />,
    );
    expect(screen.getByText("Hah!")).toBeInTheDocument();
    // While scrubbing (cutoff set), the live line is hidden.
    rerender(
      <SpeechLog
        plies={[]}
        whiteName="Alice"
        blackName="Bob"
        cutoff={0}
        streaming={{ side: "w", thinking: "", speech: "Hah!" }}
      />,
    );
    expect(screen.queryByText("Hah!")).not.toBeInTheDocument();
  });

  it("renders nothing-spoken state without blank entries", () => {
    render(
      <SpeechLog
        plies={[ply({ speech: "" })]}
        whiteName="Alice"
        blackName="Bob"
        cutoff={null}
        streaming={null}
      />,
    );
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.getByText(/no one has spoken/i)).toBeInTheDocument();
  });
});
