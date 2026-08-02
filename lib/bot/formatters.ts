import type { BotCutoffResult } from "./cutoff-query";

const DISCLAIMER =
  "Cutoffs are historical reference data, not admission guarantees. Verify official CAP data.";

function formatPercentile(value: number) {
  return `${value.toFixed(2).replace(/\.?0+$/, "")}%`;
}

function formatRank(value: number | null) {
  return value === null ? "Rank n/a" : `Rank ${value.toLocaleString("en-IN")}`;
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function getQueryFilterLabels(result: BotCutoffResult) {
  const labels = [result.query.categoryGroup];

  if (result.query.subcategory !== "all") {
    labels.push(result.query.subcategoryGroup);
  }

  labels.push(result.query.courseGroup);
  return labels;
}

export function escapeRedditMarkdown(value: string) {
  return value.replace(/([\\`*_{}\[\]()#+\-.!|>])/g, "\\$1");
}

export function formatCutoffSummaryHeader(result: BotCutoffResult) {
  return `MHT-CET state cutoffs near ${result.query.percentile} percentile, ${result.query.year} ${result.query.roundLabel}, ${getQueryFilterLabels(result).join(", ")}`;
}

export function formatDiscordCutoffResponse(result: BotCutoffResult) {
  const lines = [formatCutoffSummaryHeader(result), ""];

  if (result.rows.length === 0) {
    lines.push("No matching cutoff rows found for this query.");
  } else {
    result.rows.forEach((row, index) => {
      lines.push(
        `${index + 1}. ${truncate(row.collegeName, 72)} - ${truncate(row.courseName, 56)} | ${formatPercentile(row.cutoffScore)} | ${formatRank(row.lastRank)} | ${row.category}`,
      );
    });
  }

  lines.push("", `More: ${result.sourceUrl}`, "", DISCLAIMER);
  return lines.join("\n").slice(0, 1900);
}

export function formatRedditCutoffResponse(result: BotCutoffResult) {
  const filterLabels = getQueryFilterLabels(result)
    .map((label) => `**${escapeRedditMarkdown(label)}**`)
    .join(", ");
  const lines = [
    `MHT-CET state cutoffs near **${result.query.percentile} percentile**, **${result.query.year} ${result.query.roundLabel}**, ${filterLabels}:`,
    "",
  ];

  if (result.rows.length === 0) {
    lines.push("No matching cutoff rows found for this query.");
  } else {
    result.rows.forEach((row, index) => {
      lines.push(
        `${index + 1}. ${escapeRedditMarkdown(row.collegeName)} - ${escapeRedditMarkdown(row.courseName)} | ${formatPercentile(row.cutoffScore)} | ${formatRank(row.lastRank)} | ${escapeRedditMarkdown(row.category)}`,
      );
    });
  }

  lines.push("", `More results: ${result.sourceUrl}`, "", `_${DISCLAIMER}_`);
  return lines.join("\n");
}

export function formatInvalidCommandResponse(error: string) {
  return `${error} Try \`--percentile 95 --year 2026 --round 1 --category obc --subcategory home --course cs-it\`.`;
}
