"use client";

import {
  ActiveDot,
  Area,
  Dot,
  EvilAreaChart,
  Grid,
  XAxis,
  YAxis,
} from "@ejam/ui/components/evilcharts/charts/area-chart";
import { ChartTooltip } from "@ejam/ui/components/evilcharts/ui/tooltip";
import type { ChartConfig } from "@ejam/ui/components/evilcharts/ui/chart-types";
import type { CutoffChartPoint } from "@/lib/jee-cutoffs/types";

// The site accent marks the closing rank, the cutoff students compare against.
const chartConfig = {
  openingRank: {
    label: "Opening",
    colors: {
      light: ["#71717a"],
      dark: ["#8f8f96"],
    },
  },
  closingRank: {
    label: "Closing",
    colors: {
      light: ["#0a64e0"],
      dark: ["#3d86ff"],
    },
  },
} satisfies ChartConfig;

function formatRank(value: unknown) {
  return typeof value === "number" ? value.toLocaleString("en-IN") : "—";
}

function CutoffHoverTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; value?: unknown }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const opening = payload.find((item) => item.dataKey === "openingRank");
  const closing = payload.find((item) => item.dataKey === "closingRank");
  return (
    <div className="jee-chart-tooltip">
      <strong>{String(label ?? "")}</strong>
      <span>
        Opening <b>{formatRank(opening?.value)}</b>
      </span>
      <span>
        Closing <b>{formatRank(closing?.value)}</b>
      </span>
    </div>
  );
}

export default function CutoffChart({
  points,
  label,
}: {
  points: CutoffChartPoint[];
  label: string;
}) {
  const rows = points.map((point) => ({
    label: point.label,
    openingRank: point.openingRank,
    closingRank: point.closingRank,
  }));
  const ranks = points.flatMap((point) =>
    [point.openingRank, point.closingRank].filter(
      (value): value is number => value !== null,
    ),
  );

  if (ranks.length === 0) {
    return <p className="mht-empty">No ranks published for this seat.</p>;
  }

  const maxRank = Math.max(...ranks, 2);

  return (
    <div className="jee-chart">
      <div className="jee-chart-legend" aria-hidden="true">
        <span>
          <i className="jee-chart-key jee-chart-key-closing" />
          Closing
        </span>
        <span>
          <i className="jee-chart-key jee-chart-key-opening" />
          Opening
        </span>
      </div>
      <EvilAreaChart
        aria-label={`${label}. Rank 1 is at the top; lower is better.`}
        className="jee-chart-plot aspect-auto h-[260px] w-full"
        config={chartConfig}
        curveType="linear"
        data={rows}
        chartProps={{ margin: { left: 8, right: 12, top: 12, bottom: 4 } }}
      >
        <Grid />
        <XAxis dataKey="label" interval={0} />
        <YAxis domain={[1, maxRank]} reversed />
        <ChartTooltip
          cursor={{ strokeDasharray: "3 3", strokeWidth: 1 }}
          content={<CutoffHoverTooltip />}
        />
        <Area
          dataKey="openingRank"
          variant="gradient-reverse"
          strokeVariant="dashed"
        >
          <Dot variant="default" />
          <ActiveDot variant="default" />
        </Area>
        <Area
          dataKey="closingRank"
          variant="gradient-reverse"
          strokeVariant="solid"
        >
          <Dot variant="default" />
          <ActiveDot variant="default" />
        </Area>
      </EvilAreaChart>
    </div>
  );
}
