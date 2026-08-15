/**
 * right-side drawer for a single prediction
 * shows data quality and the per-round trajectory the table omits
 **/

"use client";

import { XIcon } from "lucide-react";
import { DashboardCard } from "@/components/dashboard-card";
import {
  ActiveDot,
  Area,
  Dot,
  EvilAreaChart,
  Grid,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/evilcharts/charts/area-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/chart-types";
import { formatInteger } from "@/components/formatter";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PredictorDisplayProgram } from "@/lib/predictor-adapters";
import { cn } from "@/lib/utils";
import { BandBadge } from "./band-badge";
import { InstituteTypeBadge } from "./institute-type-badge";
import { getMhtCetStageBadgeLabel } from "./mht-cet/stage-badge";

interface CollegeDetailSheetProps {
  program: PredictorDisplayProgram | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CollegeDetailSheet({
  program,
  open,
  onOpenChange,
}: CollegeDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full bg-background p-0 text-foreground sm:max-w-xl"
      >
        {program ? <DetailBody key={program.key} program={program} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function DetailBody({ program }: { program: PredictorDisplayProgram }) {
  const bestRoundDetail =
    program.bestRound === undefined
      ? null
      : (program.roundDetails?.[program.bestRound - 1] ?? null);
  const bestConversionLabel = bestRoundDetail
    ? getMhtCetStageBadgeLabel(bestRoundDetail.stageSemanticsId)
    : null;
  return (
    <div className="sheet-body">
      <SheetHeader className="border-b border-border p-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <InstituteTypeBadge type={program.instituteType} />
            <BandBadge band={program.band} />
            {bestConversionLabel ? (
              <ConversionBadge label={bestConversionLabel} />
            ) : null}
          </div>
          <SheetClose
            render={
              <Button
                variant="ghost"
                className="sheet-close-hit shrink-0 rounded-none"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetClose>
        </div>
        <SheetTitle className="mt-1.5 leading-tight">
          {program.instituteName}
        </SheetTitle>
        <SheetDescription className="leading-relaxed">
          {program.programName}
          {program.degree ? (
            <span className="ml-1.5 text-[11px] uppercase tracking-[0.05em] text-muted-foreground/80 tabular-nums">
              {program.degree} · {program.durationYears}y
            </span>
          ) : null}
        </SheetDescription>
      </SheetHeader>

      <section className="grid grid-cols-2 gap-px border-b border-border bg-border">
        <ProgramMetricCard
          label="Chance"
          value={formatProbability(program.overallProbability)}
          caption="At your rank"
        />
        <ProgramMetricCard
          label="Predicted closing"
          value={formatInteger(program.predictedClosingRank)}
          caption="Estimated rank"
        />
        {program.exam === "jee" ? (
          <>
            <ProgramMetricCard
              label="Weighted mean"
              value={formatInteger(program.weightedMean ?? 0)}
              caption="Historical center"
            />
            <ProgramMetricCard
              label="Sigma"
              value={formatInteger(program.sigmaEffective ?? 0)}
              caption="Model spread"
            />
          </>
        ) : (
          <>
            <ProgramMetricCard
              label="Latest percentile"
              value={
                program.latestHistoricalPercentile === null ||
                program.latestHistoricalPercentile === undefined
                  ? "Unavailable"
                  : program.latestHistoricalPercentile.toFixed(5)
              }
              caption="Historical record"
            />
            <ProgramMetricCard
              label="Choice code"
              value={program.choiceCode ?? "Unavailable"}
              caption="Official offering"
            />
          </>
        )}
      </section>

      <RoundProbabilityChart program={program} />

      <section className="border-b border-border p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Seat pool
        </h3>
        <dl className="mt-2 grid grid-cols-2 gap-y-2 text-[12px]">
          <dt className={detailTermClassName}>Matched pool</dt>
          <dd className={detailDescClassName}>{program.seatPoolLabel}</dd>
          {program.jeeProgram ? (
            <>
              <dt className={detailTermClassName}>Quota</dt>
              <dd className={detailDescClassName}>
                {program.jeeProgram.quota.toUpperCase()}
              </dd>
              <dt className={detailTermClassName}>Gender</dt>
              <dd className={detailDescClassName}>
                {program.gender ?? program.jeeProgram.gender}
              </dd>
              {program.homeState ? (
                <>
                  <dt className={detailTermClassName}>Home state</dt>
                  <dd className={detailDescClassName}>{program.homeState}</dd>
                </>
              ) : null}
              {program.fillRound ? (
                <>
                  <dt className={detailTermClassName}>Final fill round</dt>
                  <dd className={cn(detailDescClassName, "tabular-nums")}>
                    {program.fillRound}
                  </dd>
                </>
              ) : null}
            </>
          ) : null}
          {program.seatPoolsConsidered ? (
            <>
              <dt className={detailTermClassName}>Pools considered</dt>
              <dd className={cn(detailDescClassName, "space-y-1.5")}>
                {program.seatPoolsConsidered.map((pool) => {
                  const conversion = getMhtCetStageBadgeLabel(
                    pool.stage_semantics_id,
                  );
                  return (
                    <span
                      key={`${pool.id}:${pool.stage_semantics_id}:${pool.source_seat_scope_id}:${pool.effective_allocation_scope_id}`}
                      className="block rounded-sm border border-border/70 px-2 py-1.5"
                    >
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-foreground">
                          {pool.source_code}
                        </span>
                        {conversion ? (
                          <ConversionBadge label={conversion} />
                        ) : null}
                        {pool.eligible ? (
                          <span className="text-emerald-500">Eligible</span>
                        ) : (
                          <span className="text-muted-foreground">
                            Not eligible
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">
                        R{pool.rounds.join(", R")} ·{" "}
                        {pool.source_seat_scope_id.replaceAll("-", " ")} →{" "}
                        {pool.effective_allocation_scope_id.replaceAll(
                          "-",
                          " ",
                        )}
                      </span>
                    </span>
                  );
                })}
              </dd>
            </>
          ) : null}
          {bestRoundDetail ? (
            <>
              <dt className={detailTermClassName}>Historical stage</dt>
              <dd className={detailDescClassName}>
                {bestRoundDetail.stageSourceYear} ·{" "}
                {bestRoundDetail.stageSourceLabel} ·{" "}
                {bestRoundDetail.conversionDescription}
              </dd>
              <dt className={detailTermClassName}>Active rule basis</dt>
              <dd className={detailDescClassName}>
                {bestRoundDetail.activeRuleYear} Stage{" "}
                {bestRoundDetail.activeRuleLabel}
              </dd>
              <dt className={detailTermClassName}>Original seat scope</dt>
              <dd className={detailDescClassName}>
                {bestRoundDetail.sourceSeatScopeId.replaceAll("-", " ")}
              </dd>
              <dt className={detailTermClassName}>Effective scope</dt>
              <dd className={detailDescClassName}>
                {bestRoundDetail.effectiveAllocationScopeId.replaceAll(
                  "-",
                  " ",
                )}
              </dd>
              <dt className={detailTermClassName}>Eligibility applied</dt>
              <dd className={detailDescClassName}>
                {bestRoundDetail.effectiveEligibilityDescription}
              </dd>
            </>
          ) : null}
        </dl>
      </section>

      <section className="border-b border-border p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Data quality
        </h3>
        <dl className="mt-2 grid grid-cols-2 gap-y-2 text-[12px]">
          <dt className={detailTermClassName}>Signal</dt>
          <dd className={cn(detailDescClassName, "capitalize")}>
            {program.dataQuality}
          </dd>
          <dt className={detailTermClassName}>Years of data</dt>
          <dd className={cn(detailDescClassName, "tabular-nums")}>
            {program.yearsOfData}
          </dd>
          <dt className={detailTermClassName}>Most recent</dt>
          <dd className={cn(detailDescClassName, "tabular-nums")}>
            {program.latestYear}
          </dd>
          <dt className={detailTermClassName}>Supported rounds</dt>
          <dd className={cn(detailDescClassName, "tabular-nums")}>
            {program.roundCount}
          </dd>
        </dl>
      </section>

      <section className="p-4 pt-3 text-[11px] leading-relaxed text-muted-foreground">
        {program.exam === "mht-cet"
          ? "MHT-CET probabilities use limited 2024–2025 history and independently calibrated empirical uncertainty. Seat counts are not treated as probability."
          : "Predictions are estimated from historical cutoffs and trend slope: actual round cutoffs can drift with seat-matrix changes, demand shifts, and counselling rule updates each year."}
      </section>
    </div>
  );
}

function ProgramMetricCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <DashboardCard className="gap-2 border-0 bg-background px-4 py-3" size="sm">
      <CardHeader className="px-0">
        <CardTitle className="min-h-[2lh] text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-auto px-0">
        <div className="text-lg font-semibold tabular-nums text-foreground">
          {value}
        </div>
        <CardDescription className="mt-0.5 text-[11px]">
          {caption}
        </CardDescription>
      </CardContent>
    </DashboardCard>
  );
}

const roundChartConfig = {
  chance: {
    label: "Chance",
    colors: {
      light: ["#525252"],
      dark: ["#d4d4d4"],
    },
  },
} satisfies ChartConfig;

function RoundProbabilityChart({
  program,
}: {
  program: PredictorDisplayProgram;
}) {
  const rows = program.roundProbabilities.map((value, index) => ({
    round: `R${index + 1}`,
    chance:
      value === null ? null : Math.round(Math.min(1, Math.max(0, value)) * 100),
  }));

  return (
    <section className="border-b border-border p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Round-by-round probability
        </h3>
        <p className="text-[11px] text-muted-foreground/80">
          Chance that the closing rank reaches your rank in each supported
          round. Unavailable rounds include the exact source-backed reason.
        </p>
      </div>
      <EvilAreaChart
        className="mt-4 aspect-auto h-44 w-full"
        config={roundChartConfig}
        curveType="step"
        data={rows}
        chartProps={{ margin: { left: 8, right: 8, top: 12, bottom: 0 } }}
      >
        <Grid />
        <XAxis dataKey="round" interval={0} />
        <YAxis domain={[0, 100]} hide />
        <Tooltip cursor={false} valueFormatter={(value) => `${value}%`} />
        <Area dataKey="chance" variant="gradient">
          <Dot variant="default" />
          <ActiveDot variant="default" />
        </Area>
      </EvilAreaChart>
      {program.exam === "mht-cet" && program.roundDetails ? (
        <ol className="mt-4 grid gap-px border border-border bg-border text-[11px]">
          {program.roundDetails.map((detail, index) => (
            <li
              // Four fixed CAP slots have no separate persistent identity.
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed round order
              key={index}
              className="grid grid-cols-[2rem_1fr] gap-2 bg-background px-3 py-2"
            >
              <span className="font-semibold tabular-nums text-foreground">
                R{index + 1}
              </span>
              {detail ? (
                <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted-foreground">
                  <span>
                    {formatProbability(detail.probability)} · closing{" "}
                    {formatInteger(detail.predictedClosingRank)} ·{" "}
                    {detail.sourceCode} ·{" "}
                    {detail.effectiveAllocationScopeId.replaceAll("-", " ")} ·{" "}
                    {detail.dataQuality}
                  </span>
                  {detail.conversionApplied ? (
                    <ConversionBadge
                      label={
                        getMhtCetStageBadgeLabel(detail.stageSemanticsId) ??
                        "Converted stage"
                      }
                    />
                  ) : null}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {program.roundAvailability?.[index]?.reason ??
                    "No official eligible cutoff published for this round"}
                </span>
              )}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

const detailTermClassName =
  "text-[11px] uppercase tracking-[0.05em] text-muted-foreground";
const detailDescClassName = "text-[12px] text-foreground";

function ConversionBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex w-fit items-center border border-border bg-muted/40 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
      {label}
    </span>
  );
}

function formatProbability(value: number): string {
  return `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`;
}
