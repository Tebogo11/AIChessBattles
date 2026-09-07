import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SetupScreen } from "./SetupScreen";

describe("SetupScreen", () => {
  it("gates Start until both bots have a prompt", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<SetupScreen onStart={onStart} />);

    const start = screen.getByRole("button", { name: /start match/i });
    expect(start).toBeDisabled();

    const boxes = screen.getAllByPlaceholderText(/how should this bot play/i);
    await user.type(boxes[0], "attack");
    expect(start).toBeDisabled(); // still only one prompt
    await user.type(boxes[1], "defend");
    expect(start).toBeEnabled();
  });

  it("a preset fills the prompt box and stays editable", async () => {
    const user = userEvent.setup();
    render(<SetupScreen onStart={vi.fn()} />);

    const firstForm = screen.getByRole("region", { name: "White" });
    const preset = firstForm.querySelector("button.chip") as HTMLButtonElement;
    await user.click(preset);

    const box = firstForm.querySelector("textarea") as HTMLTextAreaElement;
    expect(box.value.length).toBeGreaterThan(0);

    await user.type(box, " and more");
    expect(box.value).toMatch(/and more$/);
  });

  it("passes the assembled config to onStart", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<SetupScreen onStart={onStart} />);

    const boxes = screen.getAllByPlaceholderText(/how should this bot play/i);
    await user.type(boxes[0], "aggressive");
    await user.type(boxes[1], "solid");
    await user.click(screen.getByRole("button", { name: /start match/i }));

    expect(onStart).toHaveBeenCalledOnce();
    const values = onStart.mock.calls[0][0];
    expect(values.first.prompt).toBe("aggressive");
    expect(values.second.prompt).toBe("solid");
    expect(values.randomizeColors).toBe(false);
  });
});

describe("SetupScreen colours", () => {
  it("says the first form plays White and the second plays Black", () => {
    render(<SetupScreen onStart={vi.fn()} />);
    expect(screen.getByRole("region", { name: "White" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Black" })).toBeInTheDocument();
    expect(screen.getByText(/first bot plays White, the second plays Black/i)).toBeInTheDocument();
  });

  it("leaves randomisation off, so the labels are true by default", () => {
    render(<SetupScreen onStart={vi.fn()} />);
    expect(screen.getByRole("checkbox", { name: /randomise colours/i })).not.toBeChecked();
  });

  it("stops claiming a colour once randomisation is switched on", async () => {
    const user = userEvent.setup();
    render(<SetupScreen onStart={vi.fn()} />);
    await user.click(screen.getByRole("checkbox", { name: /randomise colours/i }));

    expect(screen.queryByRole("region", { name: "White" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Bot A" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Bot B" })).toBeInTheDocument();
    expect(screen.getByText(/drawn at random when the match starts/i)).toBeInTheDocument();
  });

  it("passes the randomise choice through to onStart", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<SetupScreen onStart={onStart} />);

    const boxes = screen.getAllByPlaceholderText(/how should this bot play/i);
    await user.type(boxes[0], "aggressive");
    await user.type(boxes[1], "solid");
    await user.click(screen.getByRole("checkbox", { name: /randomise colours/i }));
    await user.click(screen.getByRole("button", { name: /start match/i }));

    expect(onStart.mock.calls[0][0].randomizeColors).toBe(true);
  });
});
