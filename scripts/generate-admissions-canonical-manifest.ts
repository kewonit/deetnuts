import "dotenv/config";

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import PocketBase from "pocketbase";
import { getMhtCetCollegePath } from "../lib/admissions/canonical";

function required(name: string, minimumLength = 1): string {
  const value = process.env[name];
  if (!value || value.length < minimumLength) {
    throw new Error(`${name} is missing or too short`);
  }
  return value;
}

async function createClient(): Promise<PocketBase> {
  const raw =
    process.env.POCKETBASE_MIGRATION_URL ||
    process.env.POCKETBASE_INTERNAL_URL ||
    "http://127.0.0.1:8090";
  const url = new URL(raw);
  if (
    url.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "pocketbase"].includes(url.hostname)
  ) {
    throw new Error("Manifest generation must use a private or loopback PocketBase URL");
  }
  const pb = new PocketBase(url.origin);
  pb.autoCancellation(false);
  await pb.collection("app_services").authWithPassword(
    required("POCKETBASE_SERVICE_EMAIL"),
    required("POCKETBASE_SERVICE_PASSWORD", 32),
  );
  return pb;
}

async function fetchAll(
  pb: PocketBase,
  collection: string,
  fields: string,
): Promise<Record<string, unknown>[]> {
  return pb.collection(collection).getFullList<Record<string, unknown>>({
    fields,
    batch: 1000,
  });
}

function mode(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized) counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0]?.[0] || null;
}

async function main() {
  const pb = await createClient();
  const [masterColleges, currentColleges] = await Promise.all([
    fetchAll(pb, "2024_mht_cet_colleges", "college_id,college_name"),
    fetchAll(pb, "2026_mht_cet_round_one_cutoffs", "college_code,college_name"),
  ]);

  const currentNames = new Map<string, string[]>();
  for (const row of currentColleges) {
    const id = String(Number(row.college_code));
    if (!/^\d+$/.test(id) || id === "0") continue;
    const names = currentNames.get(id) || [];
    names.push(String(row.college_name || ""));
    currentNames.set(id, names);
  }

  const mhtCetColleges: Record<string, string> = {};
  for (const college of masterColleges) {
    const id = String(Number(college.college_id));
    const currentName =
      mode(currentNames.get(id) || []) || String(college.college_name || "");
    mhtCetColleges[id] = getMhtCetCollegePath(currentName, id);
  }
  for (const [id, names] of currentNames) {
    if (!mhtCetColleges[id]) {
      mhtCetColleges[id] = getMhtCetCollegePath(
        mode(names) || `College ${id}`,
        id,
      );
    }
  }

  const sortedColleges = Object.fromEntries(
    Object.entries(mhtCetColleges).sort(([a], [b]) => a.localeCompare(b)),
  );
  const manifest = {
    version: 1,
    source: {
      mhtCetYear: 2026,
      mhtCetRound: 1,
    },
    mhtCetColleges: sortedColleges,
  };

  const destination = resolve(
    process.cwd(),
    "lib/admissions/canonical-manifest.generated.json",
  );
  writeFileSync(destination, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(
    `Wrote ${destination} (${Object.keys(mhtCetColleges).length} MHT-CET colleges)`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown failure";
  console.error(`Manifest generation failed: ${message}`);
  process.exitCode = 1;
});
