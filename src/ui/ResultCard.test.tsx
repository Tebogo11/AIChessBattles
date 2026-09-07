import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Ply } from "../game/types";
import { ResultCard } from "./ResultCard";

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

describe("ResultCard", () => {
  const plies = [
    ply({ index: 0, side: "w" }),
    ply({ index: 1, side: "b", stumble: true }),
    ply({ index: 2, side: "w" }),
    ply({ index: 3, side: "b", stumble: true }),
  ];

  it("shows winner, reason, moves and per-bot stumble counts", () => {
    render(
      <ResultCard
        result={{ winner: "w", reason: "checkmate" }}
        plies={plies}
        whiteName="Alice"
        blackName="Bob"
      />,
    );
    expect(screen.getByText("Alice wins")).toBeInTheDocument();
    expect(screen.getByText("Checkmate")).toBeInTheDocument();
    const moves = screen.getByText("Moves").closest("div")!;
    expect(moves).toHaveTextContent("2"); // ceil(4/2)
    const aliceStumbles = screen.getByText("Alice stumbles").closest("div")!;
    expect(aliceStumbles).toHaveTextContent("0");
    const bobStumbles = screen.getByText("Bob stumbles").closest("div")!;
    expect(bobStumbles).toHaveTextContent("2");
  });

  it("renders a draw and appears on the move cap", () => {
    render(
      <ResultCard result={{ winner: null, reason: "move-cap" }} plies={plies} whiteName="A" blackName="B" />,
    );
    expect(screen.getByText("Draw")).toBeInTheDocument();
    expect(screen.getByText(/move cap/i)).toBeInTheDocument();
  });

  it("wires rematch and edit actions", async () => {
    const user = userEvent.setup();
    const onRematch = vi.fn();
    const onEditPrompts = vi.fn();
    render(
      <ResultCard
        result={{ winner: "b", reason: "stalemate" }}
        plies={plies}
        whiteName="A"
        blackName="B"
        onRematch={onRematch}
        onEditPrompts={onEditPrompts}
      />,
    );
    await user.click(screen.getByRole("button", { name: /rematch/i }));
    await user.click(screen.getByRole("button", { name: /edit prompts/i }));
    expect(onRematch).toHaveBeenCalledOnce();
    expect(onEditPrompts).toHaveBeenCalledOnce();
  });
});
