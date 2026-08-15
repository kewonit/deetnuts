#!/usr/bin/env tsx
/**
 * asserts index lineage sidecars list the same cutoff paths the build scripts consumed
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import type { IndexLineage } from "@ejam/data/dependency-resolver";
import { DATA_DIR } from "../lib/manifest.js";

const SIDECARS = [
  {
    sidecar: "tools/college-predictor/josaa/predictor-index.lineage.json",
    cutoffRoot: "datasets/engineering/jee/josaa/cutoffs",
  },
  {
    sidecar: "tools/college-predictor/csab/predictor-index.lineage.json",
    cutoffRoot: "datasets/engineering/jee/csab/cutoffs",
  },
  {
    sidecar:
      "tools/college-predictor/maharashtra-cap/predictor-index.lineage.json",
    cutoffRoot: "datasets/engineering/mht-cet/maharashtra-cap/cutoffs",
    useDeclaredSourceYears: true,
  },
] as const;

type SidecarSpec = {
  sidecar: string;
  cutoffRoot: string;
  useDeclaredSourceYears?: boolean;
};

type ModelConfiguration = {
  target_year: number;
  source_years: number[];
};

function listCutoffParquets(cutoffRoot: string): string[] {
  const base = path.join(DATA_DIR, cutoffRoot);
  const out: string[] = [];
  for (const yearDir of fs
    .readdirSync(base)
    .filter((d) => d.startsWith("year="))) {
    const yearPath = path.join(base, yearDir);
    for (const roundDir of fs
      .readdirSync(yearPath)
      .filter((d) => d.startsWith("round="))) {
      const parquet = path.join(yearPath, roundDir, "cutoffs.parquet");
      if (fs.existsSync(parquet)) {
        out.push(
          path
            .join(cutoffRoot, yearDir, roundDir, "cutoffs.parquet")
            .split(path.sep)
            .join("/"),
        );
      }
    }
  }
  return out.sort();
}

function sha256File(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

function cutoffYear(cutoffPath: string): number {
  const match = cutoffPath.match(/\/year=(\d+)\//);
  if (!match) {
    throw new Error(`cannot determine cutoff year from ${cutoffPath}`);
  }
  return Number(match[1]);
}

function verifySidecar({
  sidecar: sidecarRel,
  cutoffRoot,
  useDeclaredSourceYears,
}: SidecarSpec): string | null {
  const absolute = path.join(DATA_DIR, sidecarRel);
  if (!fs.existsSync(absolute)) {
    return `missing sidecar: ${sidecarRel}`;
  }
  if (!fs.existsSync(path.join(DATA_DIR, cutoffRoot))) {
    return `${sidecarRel}: missing cutoff root ${cutoffRoot}`;
  }
  const lineage = JSON.parse(
    fs.readFileSync(absolute, "utf-8"),
  ) as IndexLineage;
  let expected = listCutoffParquets(cutoffRoot);
  if (useDeclaredSourceYears) {
    if (!lineage.model_configuration) {
      return `${sidecarRel}: missing model configuration for declared source-year verification`;
    }
    const configPath = path.join(DATA_DIR, lineage.model_configuration.path);
    if (!fs.existsSync(configPath)) {
      return `${sidecarRel}: missing model configuration ${lineage.model_configuration.path}`;
    }
    const config = JSON.parse(
      fs.readFileSync(configPath, "utf-8"),
    ) as ModelConfiguration;
    if (
      !Number.isInteger(config.target_year) ||
      !Array.isArray(config.source_years) ||
      config.source_years.length === 0 ||
      !config.source_years.every(Number.isInteger)
    ) {
      return `${sidecarRel}: invalid target_year or source_years in ${lineage.model_configuration.path}`;
    }
    const leakedYear = config.source_years.find(
      (year) => year >= config.target_year,
    );
    if (leakedYear !== undefined) {
      return `${sidecarRel}: source year ${leakedYear} is not earlier than target year ${config.target_year}`;
    }
    const sourceYears = new Set(config.source_years);
    expected = expected.filter((cutoffPath) =>
      sourceYears.has(cutoffYear(cutoffPath)),
    );
  }
  const actual = lineage.source_cutoffs.map((c) => c.path).sort();
  if (expected.length !== actual.length) {
    return `${sidecarRel}: expected ${expected.length} cutoffs, sidecar has ${actual.length}`;
  }
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== actual[i]) {
      return `${sidecarRel}: path mismatch at ${i}: ${actual[i]} vs ${expected[i]}`;
    }
  }
  for (const entry of lineage.source_cutoffs) {
    const cutoffPath = path.join(DATA_DIR, entry.path);
    if (!fs.existsSync(cutoffPath)) {
      return `${sidecarRel}: missing cutoff file ${entry.path}`;
    }
    const hash = sha256File(cutoffPath);
    if (hash !== entry.sha256) {
      return `${sidecarRel}: sha256 mismatch for ${entry.path}`;
    }
  }
  for (const entry of lineage.source_references ?? []) {
    const referencePath = path.join(DATA_DIR, entry.path);
    if (!fs.existsSync(referencePath)) {
      return `${sidecarRel}: missing reference file ${entry.path}`;
    }
    if (sha256File(referencePath) !== entry.sha256) {
      return `${sidecarRel}: sha256 mismatch for ${entry.path}`;
    }
  }
  if (lineage.model_configuration) {
    const configPath = path.join(DATA_DIR, lineage.model_configuration.path);
    if (!fs.existsSync(configPath)) {
      return `${sidecarRel}: missing model configuration ${lineage.model_configuration.path}`;
    }
    if (sha256File(configPath) !== lineage.model_configuration.sha256) {
      return `${sidecarRel}: sha256 mismatch for ${lineage.model_configuration.path}`;
    }
  }
  return null;
}

function main(): void {
  let failed = 0;
  for (const spec of SIDECARS) {
    const { sidecar, cutoffRoot } = spec;
    const sidecarExists = fs.existsSync(path.join(DATA_DIR, sidecar));
    const cutoffRootExists = fs.existsSync(path.join(DATA_DIR, cutoffRoot));
    if (!sidecarExists && !cutoffRootExists) {
      console.log(`- skipped ${sidecar} (dataset not present locally)`);
      continue;
    }
    const err = verifySidecar(spec);
    if (err) {
      console.error(`✗ ${err}`);
      failed++;
    } else {
      console.log(`✓ ${sidecar}`);
    }
  }
  if (failed > 0) process.exit(1);
}

main();
