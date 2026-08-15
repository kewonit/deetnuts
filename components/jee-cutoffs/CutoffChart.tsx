import type { CutoffChartPoint } from "@/lib/jee-cutoffs/types";

const WIDTH = 820;
const HEIGHT = 286;
const PADDING = { top: 22, right: 24, bottom: 38, left: 70 };

function lineSegments(
  points: CutoffChartPoint[],
  value: (point: CutoffChartPoint) => number | null,
  x: (index: number) => number,
  y: (rank: number) => number,
): string[] {
  const segments: string[] = [];
  let current = "";
  points.forEach((point, index) => {
    const rank = value(point);
    if (rank === null) {
      if (current) segments.push(current);
      current = "";
      return;
    }
    current += `${current ? " L" : "M"}${x(index).toFixed(2)} ${y(rank).toFixed(2)}`;
  });
  if (current) segments.push(current);
  return segments;
}

export default function CutoffChart({
  points,
  label,
}: {
  points: CutoffChartPoint[];
  label: string;
}) {
  const ranks = points.flatMap((point) =>
    [point.openingRank, point.closingRank].filter((value): value is number => value !== null),
  );
  if (ranks.length === 0) {
    return <p className="cutoff-empty">No comparable rank points are available.</p>;
  }
  const maxRank = Math.max(...ranks, 2);
  const chartWidth = WIDTH - PADDING.left - PADDING.right;
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const x = (index: number) =>
    PADDING.left + (points.length <= 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
  const y = (rank: number) => PADDING.top + ((rank - 1) / (maxRank - 1)) * chartHeight;
  const opening = lineSegments(points, (point) => point.openingRank, x, y);
  const closing = lineSegments(points, (point) => point.closingRank, x, y);
  const gridRanks = [1, Math.max(1, Math.round(maxRank / 2)), maxRank];

  return (
    <div className="cutoff-chart-wrap">
      <div className="cutoff-chart-legend" aria-hidden="true">
        <span><i className="cutoff-chart-key cutoff-chart-key-opening" />Opening rank</span>
        <span><i className="cutoff-chart-key cutoff-chart-key-closing" />Closing rank</span>
      </div>
      <svg
        className="cutoff-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${label}. Rank 1 is at the top; lower is better.`}
      >
        {gridRanks.map((rank) => (
          <g key={rank}>
            <line className="cutoff-chart-grid" x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y(rank)} y2={y(rank)} />
            <text className="cutoff-chart-axis" x={PADDING.left - 12} y={y(rank) + 4} textAnchor="end">
              {rank.toLocaleString("en-IN")}
            </text>
          </g>
        ))}
        {points.map((point, index) => (
          <text className="cutoff-chart-axis" x={x(index)} y={HEIGHT - 12} textAnchor="middle" key={point.label}>
            {point.label}
          </text>
        ))}
        {opening.map((pathValue) => <path className="cutoff-chart-line cutoff-chart-opening" d={pathValue} key={pathValue} />)}
        {closing.map((pathValue) => <path className="cutoff-chart-line cutoff-chart-closing" d={pathValue} key={pathValue} />)}
        {points.flatMap((point, index) => [
          point.openingRank === null ? null : <circle className="cutoff-chart-dot cutoff-chart-dot-opening" cx={x(index)} cy={y(point.openingRank)} r="3.5" key={`o-${point.label}`} />,
          point.closingRank === null ? null : <circle className="cutoff-chart-dot cutoff-chart-dot-closing" cx={x(index)} cy={y(point.closingRank)} r="3.5" key={`c-${point.label}`} />,
        ])}
      </svg>
      <p className="cutoff-chart-note">Lower is better. Missing rounds remain gaps.</p>
      <ul className="cutoff-sr-table">
        {points.map((point) => (
          <li key={`${point.year ?? ""}-${point.round ?? ""}-${point.label}`}>
            {point.label}: opening {point.openingRank?.toLocaleString("en-IN") ?? "not available"}; closing {point.closingRank?.toLocaleString("en-IN") ?? "not available"}.
          </li>
        ))}
      </ul>
    </div>
  );
}
