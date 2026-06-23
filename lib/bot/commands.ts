import type { BotCutoffQueryInput } from "./cutoff-query";

export interface ParsedCutoffCommand {
  percentile: number;
  year?: number;
  round?: number;
  category?: string;
  subcategory?: string;
  branch?: string;
  course?: string;
}

export type ParseCutoffCommandResult =
  | { ok: true; command: ParsedCutoffCommand }
  | { ok: false; error: string };

const FLAG_NAMES =
  "percentile|year|round|category|subcategory|sub-category|sub_category|seat|seat-type|seat_type|branch|course";
const FLAG_PATTERN = new RegExp(
  `--(?<name>${FLAG_NAMES})(?:=|\\s+)(?<value>.*?)(?=\\s+--(?:${FLAG_NAMES})(?:=|\\s+)|$)`,
  "gis",
);

function cleanFlagValue(value: string) {
  const trimmed = value.trim();
  const quoted = trimmed.match(/^["'](?<value>.*)["']$/s);
  return (quoted?.groups?.value ?? trimmed).trim();
}

function canonicalFlagName(name: string) {
  if (name === "branch" || name === "course") return "course";
  if (
    name === "sub-category" ||
    name === "sub_category" ||
    name === "seat" ||
    name === "seat-type" ||
    name === "seat_type"
  ) {
    return "subcategory";
  }
  return name;
}

export function parseCutoffFlagCommand(text: string): ParseCutoffCommandResult {
  if (!/--percentile\b/i.test(text)) {
    return {
      ok: false,
      error: "Use --percentile <value> to ask for cutoffs.",
    };
  }

  const values = new Map<string, string>();

  for (const match of text.matchAll(FLAG_PATTERN)) {
    const rawName = match.groups?.name?.toLowerCase();
    const name = rawName ? canonicalFlagName(rawName) : undefined;
    const value = match.groups?.value
      ? cleanFlagValue(match.groups.value)
      : undefined;
    if (!name || !value) continue;

    if (values.has(name)) {
      return {
        ok: false,
        error:
          name === "course"
            ? "Only one course value is supported per comment."
            : `Only one --${name} value is supported per comment.`,
      };
    }

    values.set(name, value);
  }

  const percentile = values.get("percentile");
  if (!percentile) {
    return {
      ok: false,
      error: "Missing percentile. Try --percentile 95 --year 2025 --round 1.",
    };
  }

  const parsed: BotCutoffQueryInput = {
    percentile: Number.parseFloat(percentile),
  };

  const year = values.get("year");
  if (year) {
    parsed.year = Number.parseInt(year, 10);
  }

  const round = values.get("round");
  if (round) {
    parsed.round = Number.parseInt(round, 10);
  }

  const category = values.get("category");
  if (category) {
    parsed.category = category;
  }

  const subcategory = values.get("subcategory");
  if (subcategory) {
    parsed.subcategory = subcategory;
  }

  const course = values.get("course");
  if (course) {
    parsed.course = course;
  }

  return { ok: true, command: parsed };
}

export const CUTOFF_COMMAND_USAGE =
  "Try `--percentile 95 --year 2025 --round 1 --category obc --subcategory home --course cs-it`.";
