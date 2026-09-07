import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Ply } from "../game/types";
import { BotPanel } from "./BotPanel";

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

describe("BotPanel", () => {
  it("shows live reasoning while this bot is thinking (no bare spinner)", () => {
    render(
      <BotPanel
        name="White"
        side="w"
        plies={[]}
        active
        streaming={{ side: "w", thinking: "Eyeing the centre", speech: "" }}
        viewedIndex={null}
      />,
    );
    expect(screen.getByText("Eyeing the centre")).toBeInTheDocument();
    expect(screen.getByText("thinking…")).toBeInTheDocument();
  });

  it("does not show the other bot's stream", () => {
    render(
      <BotPanel
        name="Black"
        side="b"
        plies={[]}
        active={false}
        streaming={{ side: "w", thinking: "white's secret plan", speech: "" }}
        viewedIndex={null}
      />,
    );
    expect(screen.queryByText("white's secret plan")).not.toBeInTheDocument();
  });

  it("shows a move's stored reasoning and highlights the scrubbed ply", () => {
    const plies = [
      ply({ index: 0, side: "w", san: "e4", thinking: "open lines" }),
      ply({ index: 2, side: "w", san: "Nf3", thinking: "develop" }),
    ];
    const { container } = render(
      <BotPanel name="White" side="w" plies={plies} active={false} streaming={null} viewedIndex={2} />,
    );
    expect(screen.getByText("open lines")).toBeInTheDocument();
    expect(screen.getByText("develop")).toBeInTheDocument();
    // The reviewed ply (index 2) carries the highlight class.
    expect(container.querySelector(".panel__move--viewed")).not.toBeNull();
  });

  it("counts stumbles", () => {
    const plies = [ply({ index: 0, san: "a3", stumble: true, thinking: "oops" })];
    render(<BotPanel name="White" side="w" plies={plies} active={false} streaming={null} viewedIndex={null} />);
    expect(screen.getByText(/1 stumble/)).toBeInTheDocument();
  });
});
