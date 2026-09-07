import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { EvalEngine } from "../analysis/evalEngine";
import type { BotConfig } from "../game/botConfig";
import type { Match } from "../game/useMatch";
import type { Ply, Side } from "../game/types";
import { MatchScreen } from "./MatchScreen";

// The board measures itself against a real layout engine, which jsdom has no
// opinion about; it is also not what this seam is testing.
vi.mock("react-chessboard", () => ({
  Chessboard: ({ options }: { options: { position: string } }) => (
    <div data-testid="board" data-fen={options.position} />
  ),
}));

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

/** A ply log from SAN, for the capture and export paths. */
const log = (sans: string[], over: Partial<Ply>[] = []): Ply[] =>
  sans.map((san, index) =>
    ply({ index, side: (index % 2 === 0 ? "w" : "b") as Side, san, ...(over[index] ?? {}) }),
  );

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

const config = (over: Partial<BotConfig> = {}): BotConfig => ({
  name: "Alice",
  prompt: "Play sharply and never trade queens.",
  provider: "anthropic",
  model: "claude-opus-5",
  ...over,
});

const renderScreen = (match: Match, props: Partial<Parameters<typeof MatchScreen>[0]> = {}) =>
  render(
    <MemoryRouter>
      <MatchScreen match={match} whiteName="Alice" blackName="Bob" {...props} />
    </MemoryRouter>,
  );

const whiteCard = () => screen.getByRole("region", { name: "Alice, playing White" });
const blackCard = () => screen.getByRole("region", { name: "Bob, playing Black" });

describe("MatchScreen colour identity", () => {
  it("labels each bot with the colour it is playing", () => {
    renderScreen(baseMatch());
    expect(within(whiteCard()).getByText("White")).toBeInTheDocument();
    expect(within(blackCard()).getByText("Black")).toBeInTheDocument();
  });

  it("shows the provider and model driving each bot", () => {
    renderScreen(baseMatch(), {
      whiteConfig: config(),
      blackConfig: config({ name: "Bob", provider: "ollama", model: "llama3.2" }),
    });
    expect(within(whiteCard()).getByText("anthropic · claude-opus-5")).toBeInTheDocument();
    expect(within(blackCard()).getByText("ollama · llama3.2")).toBeInTheDocument();
  });

  it("shows the raw prompt and expands it in place", async () => {
    const user = userEvent.setup();
    renderScreen(baseMatch(), { whiteConfig: config() });
    const card = whiteCard();
    expect(within(card).getByText(/never trade queens/)).toBeInTheDocument();

    await user.click(within(card).getByRole("button", { name: /show full prompt/i }));
    expect(within(card).getByRole("button", { name: /show less/i })).toBeInTheDocument();
  });
});

describe("MatchScreen captured pieces", () => {
  // A pawn each, then the black queen goes hunting and wins a pawn and a knight.
  const traded = baseMatch({
    plies: log(["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5", "b4", "Qxb4", "Nb5", "Qxb5"]),
  });

  it("reports what each bot has taken", () => {
    renderScreen(traded);
    expect(within(whiteCard()).getByText(/has captured a pawn$/)).toBeInTheDocument();
    expect(within(blackCard()).getByText(/has captured a knight and 2 pawns/)).toBeInTheDocument();
  });

  it("badges the side that is ahead on material, and only that side", () => {
    renderScreen(traded);
    expect(within(blackCard()).getByTitle("Material advantage")).toHaveTextContent("+4");
    expect(within(whiteCard()).queryByTitle("Material advantage")).not.toBeInTheDocument();
  });

  it("follows the scrub cursor back to the start", async () => {
    const user = userEvent.setup();
    renderScreen(traded);
    await user.click(screen.getByTitle("First position"));
    expect(within(whiteCard()).getByText(/has captured nothing yet/)).toBeInTheDocument();
    expect(within(blackCard()).getByText(/has captured nothing yet/)).toBeInTheDocument();
  });
});

describe("MatchScreen reasoning block", () => {
  it("puts reasoning in the lanes below the board, not in the bot cards", () => {
    renderScreen(baseMatch());
    expect(within(whiteCard()).queryByText("white plan")).not.toBeInTheDocument();
    const lane = screen.getByLabelText("Alice reasoning");
    expect(within(lane).getByText("white plan")).toBeInTheDocument();
  });

  it("streams the live thought into the thinking bot's lane only", () => {
    renderScreen(
      baseMatch({
        plies: [],
        streaming: { side: "b", thinking: "Eyeing the centre", speech: "" },
      }),
    );
    expect(
      within(screen.getByLabelText("Bob reasoning")).getByText("Eyeing the centre"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Alice reasoning")).queryByText("Eyeing the centre"),
    ).not.toBeInTheDocument();
  });

  it("keeps the conversation on screen beside the board", () => {
    renderScreen(baseMatch({ plies: [ply({ index: 0, speech: "Your move." })] }));
    const talk = screen.getByRole("region", { name: /match talk/i });
    expect(within(talk).getByText("Your move.")).toBeInTheDocument();
  });
});

describe("MatchScreen mobile bot details", () => {
  it("opens both bots' details in a sheet on tap", async () => {
    const user = userEvent.setup();
    renderScreen(baseMatch(), { whiteConfig: config() });

    await user.click(screen.getByRole("button", { name: /bot details/i }));
    const sheet = screen.getByRole("dialog", { name: /bot details/i });
    expect(within(sheet).getByText("White")).toBeInTheDocument();
    expect(within(sheet).getByText("Black")).toBeInTheDocument();

    await user.click(within(sheet).getByRole("button", { name: /close ✕/i }));
    expect(screen.queryByRole("dialog", { name: /bot details/i })).not.toBeInTheDocument();
  });

  it("shows the current-player status", () => {
    renderScreen(baseMatch());
    expect(screen.getByText(/Black to play/)).toBeInTheDocument();
  });
});

describe("MatchScreen result card", () => {
  const finished = baseMatch({
    runState: "finished",
    result: { winner: "w", reason: "checkmate" },
  });

  it("offers the reasoning, the PGN and somewhere to replay it", () => {
    renderScreen(finished);
    const card = screen.getByRole("dialog", { name: /match result/i });
    expect(within(card).getByRole("button", { name: /download reasoning/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /download pgn/i })).toBeInTheDocument();
    const link = within(card).getByRole("link", { name: /chesstempo/i });
    expect(link).toHaveAttribute("href", "https://chesstempo.com/pgn-viewer/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(within(card).getByText(/download the pgn first/i)).toBeInTheDocument();
  });

  it("offers none of that while the match is still running", () => {
    renderScreen(baseMatch());
    expect(screen.queryByRole("button", { name: /download pgn/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /analyse game/i })).not.toBeInTheDocument();
  });
});

describe("MatchScreen analysis", () => {
  const analysed = baseMatch({
    plies: log(["e4", "e5", "Nf3", "Nc6"], [{}, { stumble: true }]),
    runState: "finished",
    result: { winner: "w", reason: "checkmate" },
  });

  /** The seam: a scripted engine, so no test starts a real Stockfish worker. */
  const fakeEngine = (): EvalEngine => ({
    evaluate: vi.fn(async () => ({ cp: 120 })),
    dispose: vi.fn(),
  });

  it("runs the engine only when asked, over every position in the game", async () => {
    const user = userEvent.setup();
    const engine = fakeEngine();
    renderScreen(analysed, { createEngine: () => engine });

    expect(engine.evaluate).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /analyse game/i }));

    await waitFor(() => {
      expect(screen.getByText(/engine-objective advantage/i)).toBeInTheDocument();
    });
    // One position per ply, plus the starting position.
    expect(engine.evaluate).toHaveBeenCalledTimes(5);
    expect(engine.dispose).toHaveBeenCalled();
  });

  it("shows progress while the engine is still working", async () => {
    const user = userEvent.setup();
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const engine: EvalEngine = {
      evaluate: vi.fn(async () => {
        await held;
        return { cp: 0 };
      }),
      dispose: vi.fn(),
    };
    renderScreen(analysed, { createEngine: () => engine });
    await user.click(screen.getByRole("button", { name: /analyse game/i }));

    expect(screen.getByText(/analysing… 0 of 5 positions/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
    release();
    await waitFor(() => {
      expect(screen.getByText(/engine-objective advantage/i)).toBeInTheDocument();
    });
  });
});
