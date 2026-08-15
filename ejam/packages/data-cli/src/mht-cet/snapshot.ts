#!/usr/bin/env tsx

import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { DATA_DIR } from "../repo-root.js";
import { createMhtCetSnapshot } from "./supabase-snapshot.js";

function requiredEnvironment(name: string, fallback?: string): string {
  const value = process.env[name] ?? (fallback ? process.env[fallback] : "");
  if (!value) {
    throw new Error(
      `${name} is required${fallback ? ` (or local fallback ${fallback})` : ""}`,
    );
  }
  return value;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      output: { type: "string" },
      "run-id": { type: "string" },
      publish: { type: "boolean", default: false },
      "official-root": { type: "string" },
    },
  });
  if (values.publish) {
    if (!values["official-root"]) {
      throw new Error(
        "--publish requires --official-root; a Deetnuts-only snapshot can never be published",
      );
    }
    throw new Error(
      "--publish is handled by mht-cet:normalize after official parity validation",
    );
  }

  const runId = values["run-id"] ?? randomUUID();
  const outputDir = resolve(
    values.output ??
      resolve(DATA_DIR, "_scratch", "mht-cet", "snapshots", runId),
  );
  const result = await createMhtCetSnapshot({
    baseUrl: requiredEnvironment(
      "DEETNUTS_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
    secretKey: requiredEnvironment(
      "DEETNUTS_SUPABASE_SECRET_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ),
    outputDir,
    runId,
  });
  console.log(
    `MHT-CET read-only snapshot complete: ${result.cutoffRows} cutoff rows`,
  );
  console.log(`Audit report: ${result.reportPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
