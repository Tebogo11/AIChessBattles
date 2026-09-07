import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import type { EvalPoint } from "../analysis/analyseMatch";
import type { Side } from "../game/types";

export interface StumbleMark {
  /** The ply index the bot stumbled on. */
  index: number;
  side: Side;
}

interface EvalChartProps {
  points: EvalPoint[];
  stumbles: StumbleMark[];
  whiteName: string;
  blackName: string;
  width?: number;
  height?: number;
}

const WHITE_FILL = "#e8e8ea";
const BLACK_FILL = "#3a3f52";
const LINE = "#7c9cff";
const STUMBLE = "#ffb37a";

/**
 * Win probability from first ply to last, always from White's perspective.
 *
 * Sized in explicit pixels rather than through a responsive container: this
 * whole issue exists to stop the match view resizing itself, and a container
 * that re-measures on every layout pass is the exact behaviour being removed
 * (#15).
 */
export function EvalChart({
  points,
  stumbles,
  whiteName,
  blackName,
  width = 480,
  height = 220,
}: EvalChartProps) {
  const whiteStumbles = stumbles.filter((s) => s.side === "w").length;
  const blackStumbles = stumbles.filter((s) => s.side === "b").length;

  // A stumble on ply n shows on the curve at the position that ply produced.
  const marks = stumbles
    .map((s) => ({ ...s, point: points.find((p) => p.ply === s.index + 1) }))
    .filter((s): s is StumbleMark & { point: EvalPoint } => s.point !== undefined);

  return (
    <div className="evalchart">
      <div className="evalchart__scroll">
        <AreaChart
          width={width}
          height={height}
          data={points}
          margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
        >
          <defs>
            {/* The y-axis is pinned to 0–100, so a hard stop at 50% of the
                gradient lands exactly on the halfway line. */}
            <linearGradient id="evalchart-split" x1="0" y1="0" x2="0" y2="1">
              <stop offset="50%" stopColor={WHITE_FILL} stopOpacity={0.9} />
              <stop offset="50%" stopColor={BLACK_FILL} stopOpacity={0.9} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2f3342" vertical={false} />
          <XAxis
            dataKey="ply"
            stroke="#9aa0b4"
            tick={{ fontSize: 11 }}
            label={{ value: "ply", position: "insideBottomRight", fontSize: 11, fill: "#9aa0b4" }}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            stroke="#9aa0b4"
            tick={{ fontSize: 11 }}
            width={34}
          />
          <ReferenceLine y={50} stroke="#9aa0b4" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="winPct"
            baseValue={50}
            stroke={LINE}
            strokeWidth={2}
            fill="url(#evalchart-split)"
            isAnimationActive={false}
            dot={false}
          />
          {marks.map((mark) => (
            <ReferenceDot
              key={`${mark.side}-${mark.index}`}
              x={mark.point.ply}
              y={mark.point.winPct}
              r={4}
              fill={STUMBLE}
              stroke={mark.side === "w" ? WHITE_FILL : BLACK_FILL}
            />
          ))}
        </AreaChart>
      </div>

      <ul className="evalchart__legend">
        <li>
          <span className="swatch swatch--w" aria-hidden="true" /> {whiteName} winning above the
          line
        </li>
        <li>
          <span className="swatch swatch--b" aria-hidden="true" /> {blackName} winning below it
        </li>
        <li>
          <span className="swatch swatch--stumble" aria-hidden="true" /> Stumbles: {whiteName}{" "}
          {whiteStumbles}, {blackName} {blackStumbles}
        </li>
      </ul>
    </div>
  );
}
