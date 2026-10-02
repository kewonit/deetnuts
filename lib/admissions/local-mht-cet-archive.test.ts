import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  collegeCodeKey,
  indexCutoffRecords,
  readLocalMhtCetCollegeCutoffs,
} from "./local-mht-cet-archive";
import type { MhtCetCutoffRow } from "./data";

function row(code: string, course: string, category: string): MhtCetCutoffRow {
  return {
    id: `${code}-${course}-${category}`,
    college_code: code,
    college_name: "Example",
    course_code: course,
    course_name: course,
    category,
    seat_allocation_section: "STATE_LEVEL",
    cutoff_score: 90,
    last_rank: 1000,
  };
}

test("college codes match with or without leading zeros", () => {
  assert.equal(collegeCodeKey("03475"), "3475");
  assert.equal(collegeCodeKey("3475"), "3475");
});

test("cutoff records are grouped by college and sorted", () => {
  const index = indexCutoffRecords([
    row("03475", "Mechanical", "GOPENH"),
    row("3475", "Civil", "LOBC"),
    row("6278", "Computer", "GOPENH"),
  ]);
  assert.deepEqual(
    index.get("3475")?.map((record) => record.course_name),
    ["Civil", "Mechanical"],
  );
  assert.equal(index.get("6278")?.length, 1);
});

test("years without a local archive are not substituted", () => {
  assert.equal(readLocalMhtCetCollegeCutoffs("3475", 2024, 1), null);
});

const archivePath =
  "data/output/mahacet_2026_cap_round_1/database/normalized_cutoffs.json";

test("a partial archive cannot prove that an absent college is missing", (t) => {
  const root = mkdtempSync(join(tmpdir(), "mht-archive-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const file = join(root, archivePath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    JSON.stringify({ records: [row("03475", "Civil", "GOPENH")] }),
  );
  assert.equal(readLocalMhtCetCollegeCutoffs("3475", 2026, 1, root)?.length, 1);
  assert.equal(readLocalMhtCetCollegeCutoffs("3207", 2026, 1, root), null);
  assert.equal(readLocalMhtCetCollegeCutoffs("3475", 2024, 1, root), null);
});

test("missing, malformed, and unexpected archive shapes remain unavailable", (t) => {
  const root = mkdtempSync(join(tmpdir(), "mht-archive-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const file = join(root, archivePath);
  assert.equal(readLocalMhtCetCollegeCutoffs("3475", 2026, 1, root), null);
  mkdirSync(dirname(file), { recursive: true });
  for (const contents of ["{", "null", "[]", JSON.stringify({ records: {} })]) {
    writeFileSync(file, contents);
    assert.equal(readLocalMhtCetCollegeCutoffs("3475", 2026, 1, root), null);
  }
});

test("archive indexes from different roots never share data", (t) => {
  const roots = ["first", "second"].map(() =>
    mkdtempSync(join(tmpdir(), "mht-archive-")),
  );
  t.after(() =>
    roots.forEach((root) => rmSync(root, { recursive: true, force: true })),
  );
  roots.forEach((root, index) => {
    const file = join(root, archivePath);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(
      file,
      JSON.stringify({ records: [row("03475", "Course " + index, "GOPENH")] }),
    );
  });
  assert.equal(
    readLocalMhtCetCollegeCutoffs("3475", 2026, 1, roots[0])?.[0].course_name,
    "Course 0",
  );
  assert.equal(
    readLocalMhtCetCollegeCutoffs("3475", 2026, 1, roots[1])?.[0].course_name,
    "Course 1",
  );
});
