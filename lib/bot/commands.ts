import type { BotCutoffQueryInput } from "./cutoff-query";

export interface ParsedCutoffCommand {
  percentile: number;
  year?: number;
  round?: number;
  category?: string;
  branch?: string;
}

export type ParseCutoffCommandResult =
  | { ok: true; command: ParsedCutoffCommand }
  | { ok: false; error: string };

const FLAG_PATTERN =
  /--(?<name>percentile|year|round|category|branch|course)(?:=|\s+)(?<value>.*?)(?=\s+--(?:percentile|year|round|category|branch|course)(?:=|\s+)|$)/gis;

function cleanFlagValue(value: string) {
  const trimmed = value.trim();
  const quoted = trimmed.match(/^["'](?<value>.*)["']$/s);
  return (quoted?.groups?.value ?? trimmed).trim();
}

function canonicalFlagName(name: string) {
  return name === "course" ? "branch" : name;
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
          name === "branch"
            ? "Only one branch/course value is supported per comment."
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

  const branch = values.get("branch");
  if (branch) {
    parsed.branch = branch;
  }

  return { ok: true, command: parsed };
}

export const CUTOFF_COMMAND_USAGE =
  "Try `--percentile 95 --year 2025 --round 1 --category obc --branch cs-it`.";
