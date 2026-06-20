import type { BotCutoffQueryInput } from "./cutoff-query";

export interface ParsedCutoffCommand {
  percentile: number;
  year?: number;
  round?: number;
}

export type ParseCutoffCommandResult =
  | { ok: true; command: ParsedCutoffCommand }
  | { ok: false; error: string };

const FLAG_PATTERN =
  /--(?<name>percentile|year|round)(?:=|\s+)(?<value>\d+(?:\.\d+)?)/gi;

export function parseCutoffFlagCommand(text: string): ParseCutoffCommandResult {
  if (!text.includes("--percentile")) {
    return {
      ok: false,
      error: "Use --percentile <value> to ask for cutoffs.",
    };
  }

  const values = new Map<string, string>();

  for (const match of text.matchAll(FLAG_PATTERN)) {
    const name = match.groups?.name?.toLowerCase();
    const value = match.groups?.value;
    if (!name || !value) continue;

    if (values.has(name)) {
      return {
        ok: false,
        error: `Only one --${name} value is supported per comment.`,
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

  return { ok: true, command: parsed };
}

export const CUTOFF_COMMAND_USAGE =
  "Try `--percentile 95 --year 2025 --round 1`.";
