import "dotenv/config";

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import PocketBase from "pocketbase";
import { getMhtCetCollegePath } from "../lib/admissions/canonical";
import { MHT_CET_HOME_UNIVERSITIES } from "../lib/mht-cet/state-cutoffs/candidate-profile";
import { ROUND_CONFIG_2026 } from "../lib/mht-cet/state-cutoffs/config";

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
  // Later CAP rounds add institutes that had no earlier list, so every round counts.
  const currentRounds = Object.entries(ROUND_CONFIG_2026).sort(
    ([a], [b]) => Number(a) - Number(b),
  );
  const masterColleges = await fetchAll(
    pb,
    "2024_mht_cet_colleges",
    "college_id,college_name",
  );
  // One collection at a time keeps the load on the small production host low.
  const currentColleges: Record<string, unknown>[] = [];
  for (const [, collection] of currentRounds) {
    currentColleges.push(
      ...(await fetchAll(
        pb,
        collection,
        "college_code,college_name,status,institute_home_university_id",
      )),
    );
  }

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

  // A small server-side directory of the current year's colleges, so listing
  // pages render without querying every cutoff row.
  const universityLabels = new Map(
    MHT_CET_HOME_UNIVERSITIES.map((option) => [option.id, option.label]),
  );
  const directory = [...currentNames.keys()]
    .map((id) => {
      const rows = currentColleges.filter(
        (row) => String(Number(row.college_code)) === id,
      );
      const universityId = mode(
        rows.map((row) => String(row.institute_home_university_id || "")),
      );
      return {
        code: id.padStart(5, "0"),
        name: mode(currentNames.get(id) || []) || `College ${id}`,
        status: mode(rows.map((row) => String(row.status || ""))) || "",
        homeUniversity: (universityId && universityLabels.get(universityId)) || "",
        path: mhtCetColleges[id],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en-IN"));
  const directoryDestination = resolve(
    process.cwd(),
    "lib/admissions/mht-cet-directory.generated.json",
  );
  writeFileSync(
    directoryDestination,
    `${JSON.stringify(
      {
        version: 1,
        source: { mhtCetYear: 2026, mhtCetRounds: currentRounds.map(([round]) => Number(round)) },
        colleges: directory,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`Wrote ${directoryDestination} (${directory.length} current colleges)`);

  const sortedColleges = Object.fromEntries(
    Object.entries(mhtCetColleges).sort(([a], [b]) => a.localeCompare(b)),
  );
  const manifest = {
    version: 1,
    source: {
      mhtCetYear: 2026,
      mhtCetRounds: currentRounds.map(([round]) => Number(round)),
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
  const detail =
    error && typeof error === "object" && "status" in error
      ? ` (status ${String((error as { status: unknown }).status)}, ${String((error as { url?: unknown }).url ?? "")} ${String((error as { originalError?: { message?: unknown } }).originalError?.message ?? "")})`
      : "";
  console.error(`Manifest generation failed: ${message}${detail}`);
  process.exitCode = 1;
});
