import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { EvalPoint } from "../analysis/analyseMatch";
import { EvalChart } from "./EvalChart";

const points: EvalPoint[] = [
  { ply: 0, winPct: 50 },
  { ply: 1, winPct: 62 },
  { ply: 2, winPct: 41 },
  { ply: 3, winPct: 78 },
];

const renderChart = (over: Partial<Parameters<typeof EvalChart>[0]> = {}) =>
  render(
    <EvalChart
      points={points}
      stumbles={[{ index: 1, side: "b" }]}
      whiteName="Alice"
      blackName="Bob"
      {...over}
    />,
  );

describe("EvalChart", () => {
  it("draws a curve for the points it was given", () => {
    const { container } = renderChart();
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelectorAll("path.recharts-area-area").length).toBeGreaterThan(0);
  });

  it("is a fixed size, not a responsive one", () => {
    // The whole issue exists to stop the match view resizing itself.
    const { container } = renderChart({ width: 480, height: 220 });
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("480");
    expect(svg.getAttribute("height")).toBe("220");
    expect(container.querySelector(".recharts-responsive-container")).toBeNull();
  });

  it("names which half of the chart belongs to which bot", () => {
    renderChart();
    expect(screen.getByText(/Alice winning above the line/)).toBeInTheDocument();
    expect(screen.getByText(/Bob winning below it/)).toBeInTheDocument();
  });

  it("counts each bot's stumbles in the legend", () => {
    renderChart({
      stumbles: [
        { index: 1, side: "b" },
        { index: 3, side: "b" },
        { index: 0, side: "w" },
      ],
    });
    expect(screen.getByText(/Stumbles: Alice 1, Bob 2/)).toBeInTheDocument();
  });

  it("marks a stumble on the curve at the ply it happened", () => {
    const { container } = renderChart();
    expect(container.querySelectorAll(".recharts-reference-dot")).toHaveLength(1);
  });

  it("drops a stumble that has no point on the curve yet", () => {
    // Analysis fills in progressively; a marker cannot precede its point.
    const { container } = renderChart({ stumbles: [{ index: 40, side: "w" }] });
    expect(container.querySelectorAll(".recharts-reference-dot")).toHaveLength(0);
  });
});
