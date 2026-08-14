import "dotenv/config";

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { getMhtCetCollegePath } from "../lib/admissions/canonical";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  throw new Error("Supabase environment variables are required");
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fetchAll(table: string, fields: string): Promise<any[]> {
  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(table)
      .select(fields)
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) return rows;
  }
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
  const [masterColleges, currentColleges] = await Promise.all([
    fetchAll("2024_mht_cet_colleges", "college_id,college_name"),
    fetchAll("2026_mht_cet_round_one_cutoffs", "college_code,college_name"),
  ]);

  const currentNames = new Map<string, string[]>();
  for (const row of currentColleges) {
    const id = String(Number(row.college_code));
    if (!/^\d+$/.test(id) || id === "0") continue;
    const names = currentNames.get(id) || [];
    names.push(row.college_name);
    currentNames.set(id, names);
  }

  const mhtCetColleges: Record<string, string> = {};
  for (const college of masterColleges) {
    const id = String(Number(college.college_id));
    const currentName =
      mode(currentNames.get(id) || []) || college.college_name;
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
  console.error(error);
  process.exitCode = 1;
});
