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

const chartConfig = {
  openingRank: {
    label: "Opening",
    colors: {
      light: ["#18181b"],
      dark: ["#fafafa"],
    },
  },
  closingRank: {
    label: "Closing",
    colors: {
      light: ["#737373"],
      dark: ["#a3a3a3"],
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
    <div className="cutoff-chart-tooltip">
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
    return <p className="cutoff-empty">No comparable rank points are available.</p>;
  }

  const maxRank = Math.max(...ranks, 2);

  return (
    <div className="cutoff-chart-wrap">
      <div className="cutoff-chart-legend" aria-hidden="true">
        <span>
          <i className="cutoff-chart-key cutoff-chart-key-opening" />
          Opening rank
        </span>
        <span>
          <i className="cutoff-chart-key cutoff-chart-key-closing" />
          Closing rank
        </span>
      </div>
      <EvilAreaChart
        aria-label={`${label}. Rank 1 is at the top; lower is better.`}
        className="cutoff-chart mt-2 aspect-auto h-[286px] w-full"
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
        <Area dataKey="openingRank" variant="solid" strokeVariant="solid" areaProps={{ className: "cutoff-chart-opening" }}>
          <Dot variant="default" />
          <ActiveDot variant="default" />
        </Area>
        <Area dataKey="closingRank" variant="solid" strokeVariant="dashed" areaProps={{ className: "cutoff-chart-closing" }}>
          <Dot variant="default" />
          <ActiveDot variant="default" />
        </Area>
      </EvilAreaChart>
    </div>
  );
}
