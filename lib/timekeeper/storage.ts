import { z } from "zod";

export const themes = [
  "light",
  "dark",
  "ocean",
  "valentine",
  "cupcake",
] as const;
export type TimekeeperTheme = (typeof themes)[number];
export const countdownSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(100),
  description: z.string().max(200).default(""),
  targetDate: z
    .string()
    .max(40)
    .refine((date) => Number.isFinite(Date.parse(date)), "Choose a valid date"),
  color: z
    .enum(["blue", "green", "purple", "red", "yellow", "pink"])
    .default("blue"),
  createdAt: z
    .string()
    .max(40)
    .refine((date) => Number.isFinite(Date.parse(date))),
});
export type SavedCountdown = z.infer<typeof countdownSchema>;
export const transferSchema = z.object({
  version: z.literal(1),
  countdowns: z.array(countdownSchema).max(1000),
  theme: z.enum(themes).optional(),
  avatarSeed: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,100}$/)
    .optional(),
});
export type TimekeeperTransfer = z.infer<typeof transferSchema>;

// Conflicting IDs retain both originals with a stable suffix.
function stableHash(value: string): string {
  let hash = 2166136261;
  for (const char of value)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(36);
}

export function mergeCountdowns(
  existing: SavedCountdown[],
  incoming: SavedCountdown[],
): SavedCountdown[] {
  const merged = [...existing];
  for (const countdown of incoming) {
    const collision = merged.find((item) => item.id === countdown.id);
    if (!collision) {
      merged.push(countdown);
      continue;
    }
    if (JSON.stringify(collision) === JSON.stringify(countdown)) continue;
    const baseId = `${countdown.id.slice(0, 60)}-import-${stableHash(JSON.stringify(countdown))}`;
    let importId = baseId;
    let suffix = 1;
    let imported = merged.find((item) => item.id === importId);
    while (
      imported &&
      JSON.stringify(imported) !==
        JSON.stringify({ ...countdown, id: importId })
    ) {
      importId = `${baseId}-${++suffix}`;
      imported = merged.find((item) => item.id === importId);
    }
    if (!imported) merged.push({ ...countdown, id: importId });
  }
  return merged;
}

const stateKey = "timekeeper-countdown-state";
const stateSchema = z.object({
  countdowns: z.array(countdownSchema),
  imported: z.array(z.string()),
});

function readState() {
  const stored = localStorage.getItem(stateKey);
  if (stored) return stateSchema.parse(JSON.parse(stored));
  const raw: unknown = JSON.parse(
    localStorage.getItem("timekeeper-countdowns") ?? "[]",
  );
  const countdowns = Array.isArray(raw)
    ? raw.flatMap((item) => {
        const parsed = countdownSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      })
    : [];
  return { countdowns, imported: [] as string[] };
}

export function readSavedCountdowns(): SavedCountdown[] {
  try {
    return readState().countdowns;
  } catch {
    return [];
  }
}

export function saveSavedCountdowns(countdowns: SavedCountdown[]): void {
  const state = readState();
  localStorage.setItem(stateKey, JSON.stringify({ ...state, countdowns }));
  window.dispatchEvent(new Event("timekeeper-storage"));
}

export function readTransfer(): TimekeeperTransfer {
  const theme = localStorage.getItem("timekeeper-theme");
  const storedSeed =
    localStorage.getItem("timekeeper_avatar_seed") ??
    localStorage.getItem("timekeeper-avatar-seed");
  let avatarSeed: string | undefined;
  try {
    avatarSeed = storedSeed ? JSON.parse(storedSeed) : undefined;
  } catch {
    avatarSeed = storedSeed ?? undefined;
  }
  return transferSchema.parse({
    version: 1,
    countdowns: readState().countdowns,
    ...(themes.includes(theme as TimekeeperTheme) ? { theme } : {}),
    ...(avatarSeed && /^[a-zA-Z0-9_-]{1,100}$/.test(avatarSeed)
      ? { avatarSeed }
      : {}),
  });
}

export function importTransfer(value: unknown): number {
  const data = transferSchema.parse(value);
  const state = readState();
  const previous = state.countdowns;
  const ledger = state.imported;
  const fingerprints = data.countdowns.map((countdown) =>
    JSON.stringify(countdown),
  );
  const incoming = data.countdowns.filter(
    (_, index) => !ledger.includes(fingerprints[index]),
  );
  const merged = mergeCountdowns(previous, incoming);
  // Timers and the replay ledger commit in one atomic storage write. Keep the
  // original legacy storage untouched, including entries we cannot interpret.
  localStorage.setItem(
    stateKey,
    JSON.stringify({
      countdowns: merged,
      imported: Array.from(new Set([...ledger, ...fingerprints])),
    }),
  );
  if (data.theme && !localStorage.getItem("timekeeper-theme"))
    localStorage.setItem("timekeeper-theme", data.theme);
  if (data.avatarSeed && !localStorage.getItem("timekeeper_avatar_seed"))
    localStorage.setItem(
      "timekeeper_avatar_seed",
      JSON.stringify(data.avatarSeed),
    );
  window.dispatchEvent(new Event("timekeeper-storage"));
  return merged.length - previous.length;
}
