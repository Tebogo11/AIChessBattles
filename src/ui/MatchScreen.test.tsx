import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Match } from "../game/useMatch";
import type { Ply } from "../game/types";
import { MatchScreen } from "./MatchScreen";

const ply = (over: Partial<Ply>): Ply => ({
  index: 0,
  side: "w",
  san: "e4",
  fenAfter: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
  thinking: "",
  speech: "",
  stumble: false,
  durationMs: 0,
  ...over,
});

const baseMatch = (over: Partial<Match> = {}): Match => ({
  plies: [ply({ index: 0, side: "w", thinking: "white plan" })],
  runState: "paused",
  result: null,
  fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
  toMove: "b",
  thinking: false,
  streaming: null,
  error: null,
  play: () => {},
  pause: () => {},
  step: () => {},
  reset: () => {},
  ...over,
});

const renderScreen = (match: Match) =>
  render(
    <MemoryRouter>
      <MatchScreen match={match} whiteName="Alice" blackName="Bob" />
    </MemoryRouter>,
  );

describe("MatchScreen mobile thoughts drawer", () => {
  it("opens one bot's thoughts in a drawer on tap", async () => {
    const user = userEvent.setup();
    renderScreen(baseMatch());

    // The tap trigger exists (visibility is CSS-driven; presence is what matters).
    const trigger = screen.getByRole("button", { name: /Alice’s thoughts/ });
    await user.click(trigger);

    const drawer = screen.getByRole("dialog", { name: /bot thoughts/i });
    expect(within(drawer).getByText("white plan")).toBeInTheDocument();

    await user.click(within(drawer).getByRole("button", { name: /close ✕/i }));
    expect(screen.queryByRole("dialog", { name: /bot thoughts/i })).not.toBeInTheDocument();
  });

  it("shows the current-player status", () => {
    renderScreen(baseMatch());
    expect(screen.getByText(/Black to play/)).toBeInTheDocument();
  });

  it("shows the result card on termination", () => {
    renderScreen(
      baseMatch({ runState: "finished", result: { winner: "w", reason: "checkmate" } }),
    );
    expect(screen.getByRole("dialog", { name: /match result/i })).toBeInTheDocument();
  });
});
