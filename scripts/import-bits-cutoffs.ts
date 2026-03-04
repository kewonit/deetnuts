import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

type BitsRow = {
  Year: string;
  Program: string;
  Campus: string;
  Degree: string;
  Quotas: string;
  Gender: string;
  Opening: string | number;
  Closing: string | number;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
}

const csvPath =
  process.env.BITS_CUTOFFS_CSV ||
  process.argv[2] ||
  path.resolve(process.cwd(), "data", "output", "bits_cutoffs.csv");

if (!fs.existsSync(csvPath)) {
  throw new Error(
    `BITS CSV not found at ${csvPath}. Provide a file via BITS_CUTOFFS_CSV or: npm run import-bits -- <path-to-csv>`,
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function toInt(value: string | number): number | null {
  const normalized = String(value || "")
    .replace(/,/g, "")
    .trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRecord(row: BitsRow, index: number) {
  return {
    id: `${String(row.Year).trim()}-${String(row.Program).trim()}-${String(row.Campus).trim()}-${String(row.Quotas).trim()}-${String(row.Gender).trim()}-${index}`,
    Year: String(row.Year || "").trim(),
    Program: String(row.Program || "").trim(),
    Campus: String(row.Campus || "").trim(),
    Degree: String(row.Degree || "").trim(),
    Quotas: String(row.Quotas || "").trim(),
    Gender: String(row.Gender || "").trim(),
    Opening: toInt(row.Opening),
    Closing: toInt(row.Closing),
  };
}

async function main() {
  const csvRaw = fs.readFileSync(csvPath, "utf8");
  const parsed = parse(csvRaw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as BitsRow[];

  if (parsed.length === 0) {
    console.log("No rows found in BITS CSV.");
    return;
  }

  const rows = parsed
    .map(normalizeRecord)
    .filter((row) => row.Year && row.Program);

  const batchSize = 1000;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from("engineering_bits_cutoffs")
      .upsert(batch, { onConflict: "id" });

    if (error) {
      throw new Error(
        `BITS upsert failed for batch ${i / batchSize + 1}: ${error.message}`,
      );
    }

    console.log(
      `Upserted ${Math.min(i + batch.length, rows.length)}/${rows.length}`,
    );
  }

  const { count, error: countError } = await supabase
    .from("engineering_bits_cutoffs")
    .select("id", { count: "exact", head: true });

  if (countError) {
    throw new Error(`BITS verification failed: ${countError.message}`);
  }

  console.log(`BITS import completed. Destination rows: ${count || 0}`);
}

main().catch((error) => {
  console.error("BITS import failed:", error);
  process.exit(1);
});
