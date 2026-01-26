"use client";

import { TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

// Dynamic import for recharts - reduces initial bundle size

const Bar = dynamic(
  () =>
    import("recharts").then((mod) => mod.Bar) as Promise<ComponentType<any>>,
  {
    ssr: false,
  },
);

const BarChart = dynamic(
  () =>
    import("recharts").then((mod) => mod.BarChart) as Promise<
      ComponentType<any>
    >,
  {
    ssr: false,
  },
);

const CartesianGrid = dynamic(
  () =>
    import("recharts").then((mod) => mod.CartesianGrid) as Promise<
      ComponentType<any>
    >,
  { ssr: false },
);

const LabelList = dynamic(
  () =>
    import("recharts").then((mod) => mod.LabelList) as Promise<
      ComponentType<any>
    >,
  { ssr: false },
);

const XAxis = dynamic(
  () =>
    import("recharts").then((mod) => mod.XAxis) as Promise<ComponentType<any>>,
  {
    ssr: false,
  },
);

const YAxis = dynamic(
  () =>
    import("recharts").then((mod) => mod.YAxis) as Promise<ComponentType<any>>,
  {
    ssr: false,
  },
);

const Cell = dynamic(
  () =>
    import("recharts").then((mod) => mod.Cell) as Promise<ComponentType<any>>,
  {
    ssr: false,
  },
);

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../../../../components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../../../../../components/ui/chart";
import React from "react";

// Define the type for our chart data
type ChartDataItem = {
  month: string;
  week: string;
  desktop: number;
  mobile: number;
  color: string;
  label: string; // Add this line
};

const chartData: ChartDataItem[] = [
  {
    month: "January",
    week: "Week 1",
    desktop: 186,
    mobile: 80,
    color: "#FF6B6B",
    label: "January - Week 1",
  },
  {
    month: "January",
    week: "Week 2",
    desktop: 195,
    mobile: 85,
    color: "#FF6B6B",
    label: "January - Week 2",
  },
  {
    month: "January",
    week: "Week 3",
    desktop: 200,
    mobile: 90,
    color: "#FF6B6B",
    label: "January - Week 3",
  },
  {
    month: "February",
    week: "Week 1",
    desktop: 305,
    mobile: 200,
    color: "#4ECDC4",
    label: "February - Week 1",
  },
  {
    month: "February",
    week: "Week 2",
    desktop: 310,
    mobile: 210,
    color: "#4ECDC4",
    label: "February - Week 2",
  },
  {
    month: "February",
    week: "Week 3",
    desktop: 315,
    mobile: 220,
    color: "#4ECDC4",
    label: "February - Week 3",
  },
  {
    month: "March",
    week: "Week 1",
    desktop: 237,
    mobile: 120,
    color: "#45B7D1",
    label: "March - Week 1",
  },
  {
    month: "March",
    week: "Week 2",
    desktop: 245,
    mobile: 125,
    color: "#45B7D1",
    label: "March - Week 2",
  },
  {
    month: "March",
    week: "Week 3",
    desktop: 250,
    mobile: 130,
    color: "#45B7D1",
    label: "March - Week 3",
  },
  {
    month: "April",
    week: "Week 1",
    desktop: 73,
    mobile: 190,
    color: "#F7B267",
    label: "April - Week 1",
  },
  {
    month: "April",
    week: "Week 2",
    desktop: 80,
    mobile: 195,
    color: "#F7B267",
    label: "April - Week 2",
  },
  {
    month: "April",
    week: "Week 3",
    desktop: 85,
    mobile: 200,
    color: "#F7B267",
    label: "April - Week 3",
  },
  {
    month: "May",
    week: "Week 1",
    desktop: 209,
    mobile: 130,
    color: "#6A0572",
    label: "May - Week 1",
  },
  {
    month: "May",
    week: "Week 2",
    desktop: 215,
    mobile: 135,
    color: "#6A0572",
    label: "May - Week 2",
  },
  {
    month: "May",
    week: "Week 3",
    desktop: 220,
    mobile: 140,
    color: "#6A0572",
    label: "May - Week 3",
  },
  {
    month: "June",
    week: "Week 1",
    desktop: 214,
    mobile: 140,
    color: "#1B998B",
    label: "June - Week 1",
  },
  {
    month: "June",
    week: "Week 2",
    desktop: 220,
    mobile: 145,
    color: "#1B998B",
    label: "June - Week 2",
  },
  {
    month: "June",
    week: "Week 3",
    desktop: 225,
    mobile: 150,
    color: "#1B998B",
    label: "June - Week 3",
  },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
  label: {
    color: "hsl(var(--background))",
  },
} satisfies ChartConfig;

export function BITSCutoffChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>BITS Cutoff Scores - Area Chart</CardTitle>
        <CardDescription>
          Showing cutoff scores for different programs across BITS campuses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            width={16}
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="month"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value: string) => value.slice(0, 3)}
              hide
            />
            <XAxis dataKey="desktop" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar dataKey="desktop" layout="vertical" radius={4}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList
                dataKey="label"
                position="insideLeft"
                offset={8}
                className="fill-[--color-label]"
                fontSize={12}
              />
              <LabelList
                dataKey="desktop"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months, broken down by weeks
        </div>
      </CardFooter>
    </Card>
  );
}
