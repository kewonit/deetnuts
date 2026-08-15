"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

type RechartsExportName = keyof typeof import("recharts");

function dynamicRechartsComponent<Name extends RechartsExportName>(name: Name) {
  return dynamic(
    () =>
      import("recharts").then(
        (mod) => mod[name] as ComponentType<Record<string, unknown>>,
      ),
    { ssr: false },
  );
}

export const ResponsiveContainer = dynamicRechartsComponent(
  "ResponsiveContainer",
);
export const Tooltip = dynamicRechartsComponent("Tooltip");
export const Legend = dynamicRechartsComponent("Legend");
export const ZIndexLayer = dynamicRechartsComponent("ZIndexLayer");
export const Area = dynamicRechartsComponent("Area");
export const AreaChart = dynamicRechartsComponent("AreaChart");
export const Bar = dynamicRechartsComponent("Bar");
export const BarChart = dynamicRechartsComponent("BarChart");
export const Line = dynamicRechartsComponent("Line");
export const LineChart = dynamicRechartsComponent("LineChart");
export const CartesianGrid = dynamicRechartsComponent("CartesianGrid");
export const XAxis = dynamicRechartsComponent("XAxis");
export const YAxis = dynamicRechartsComponent("YAxis");

/** Namespace-style access for shadcn-style chart primitives. */
export const RechartsPrimitive = {
  ResponsiveContainer,
  Tooltip,
  Legend,
} as const;
