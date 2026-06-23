"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts";
import { Zap, Activity, Clock, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./NeobrutalismChart";
import type { BotStats } from "../lib/data";

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-2 border-black bg-main text-black shadow-base">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-black" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold sm:text-3xl">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function StatsDashboard({ stats }: { stats: BotStats }) {
  const hasData = stats.totals.totalRequests > 0;

  const dailyConfig = {
    served: { label: "Served", color: "hsl(var(--chart-2))" },
    rejected: { label: "Rejected", color: "hsl(var(--chart-4))" },
    failed: { label: "Failed", color: "hsl(var(--chart-1))" },
  };

  const durationConfig = {
    avgDurationMs: {
      label: "Response Time",
      color: "hsl(var(--chart-3))",
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Requests"
          value={stats.totals.totalRequests.toLocaleString()}
          icon={Server}
        />
        <StatCard
          title="Served"
          value={stats.totals.totalServed.toLocaleString()}
          icon={Zap}
        />
        <StatCard
          title="Avg Time"
          value={`${stats.totals.avgResponseTimeMs}ms`}
          icon={Clock}
        />
        <StatCard
          title="Uptime"
          value={`${stats.totals.uptimeDays}d`}
          icon={Activity}
        />
      </div>

      {!hasData ? (
        <Card className="border-2 border-black bg-secondary-background text-foreground shadow-base">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <Activity className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No data yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-2 border-black bg-secondary-background text-foreground shadow-base">
            <CardHeader>
              <CardTitle>Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={dailyConfig}>
                <AreaChart
                  data={stats.daily}
                  margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={10}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="served"
                    type="monotone"
                    fill="var(--color-served)"
                    stroke="var(--color-served)"
                    stackId="a"
                  />
                  <Area
                    dataKey="rejected"
                    type="monotone"
                    fill="var(--color-rejected)"
                    stroke="var(--color-rejected)"
                    stackId="a"
                  />
                  <Area
                    dataKey="failed"
                    type="monotone"
                    fill="var(--color-failed)"
                    stroke="var(--color-failed)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-2 border-black bg-secondary-background text-foreground shadow-base">
            <CardHeader>
              <CardTitle>Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={durationConfig}>
                <LineChart
                  data={stats.durations}
                  margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}ms`}
                    fontSize={10}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Line
                    dataKey="avgDurationMs"
                    type="monotone"
                    stroke="var(--color-avgDurationMs)"
                    strokeWidth={2}
                    connectNulls={false}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
