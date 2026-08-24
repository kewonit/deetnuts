import type { BotCutoffResult } from "./cutoff-query";
import { PRODUCTION_SITE_URL } from "../site-url";

const DISCLAIMER =
  "Cutoffs are historical reference data, not admission guarantees. Verify official CAP data.";
const DISCORD_RESPONSE_LIMIT = 1_900;
const STATE_CUTOFFS_URL = `${PRODUCTION_SITE_URL}/mht-cet/state-cutoffs`;

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

function formatDiscordValue(value: string, maxLength: number) {
  return truncate(value.replace(/\s+/g, " ").trim(), maxLength);
}

function formatDiscordCode(value: string | null) {
  return value ? formatDiscordValue(value, 24) : "n/a";
}

function formatDiscordCutoffRow(
  row: BotCutoffResult["rows"][number],
  index: number,
) {
  return [
    `${index + 1}. ${formatDiscordValue(row.collegeName, 64)} — ${formatDiscordValue(row.courseName, 52)}`,
    `   College code: ${formatDiscordCode(row.collegeCode)} · Branch code: ${formatDiscordCode(row.courseCode)} | ${formatPercentile(row.cutoffScore)} | ${formatRank(row.lastRank)} | ${formatDiscordValue(row.category, 24)}`,
  ];
}

function formatOmittedDiscordRows(count: number) {
  return `… ${count} more top ${count === 1 ? "result" : "results"} at the link below.`;
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
  const detailedFooter = [
    "",
    `More results: [open filtered search](${result.sourceUrl})`,
    "",
    DISCLAIMER,
  ];
  const compactFooter = [
    "",
    `More results: ${STATE_CUTOFFS_URL}`,
    "",
    DISCLAIMER,
  ];

  if (result.rows.length === 0) {
    lines.push("No matching cutoff rows found for this query.");
  } else {
    const rowBlocks = result.rows.map(formatDiscordCutoffRow);
    const firstRowWithFooter = [
      ...lines,
      ...rowBlocks[0],
      ...(rowBlocks.length > 1
        ? [formatOmittedDiscordRows(rowBlocks.length - 1)]
        : []),
      ...detailedFooter,
    ].join("\n");
    const footer =
      firstRowWithFooter.length <= DISCORD_RESPONSE_LIMIT
        ? detailedFooter
        : compactFooter;
    let displayedRows = 0;

    for (const rowBlock of rowBlocks) {
      const remainingRows = rowBlocks.length - displayedRows - 1;
      const candidate = [
        ...lines,
        ...rowBlock,
        ...(remainingRows > 0
          ? [formatOmittedDiscordRows(remainingRows)]
          : []),
        ...footer,
      ].join("\n");

      if (candidate.length > DISCORD_RESPONSE_LIMIT) break;
      lines.push(...rowBlock);
      displayedRows += 1;
    }

    const omittedRows = rowBlocks.length - displayedRows;
    if (omittedRows > 0) {
      lines.push(formatOmittedDiscordRows(omittedRows));
    }

    lines.push(...footer);
    return lines.join("\n");
  }

  const detailedResponse = [...lines, ...detailedFooter].join("\n");
  return detailedResponse.length <= DISCORD_RESPONSE_LIMIT
    ? detailedResponse
    : [...lines, ...compactFooter].join("\n");
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
