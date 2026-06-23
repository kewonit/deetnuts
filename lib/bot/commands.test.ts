import assert from "node:assert/strict";
import test from "node:test";

import { parseCutoffFlagCommand } from "./commands";

test("parseCutoffFlagCommand parses flags in any order", () => {
  const result = parseCutoffFlagCommand(
    "please check --round 2 --percentile 95.5 --category obc --subcategory home --year 2025",
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.command, {
      percentile: 95.5,
      year: 2025,
      round: 2,
      category: "obc",
      subcategory: "home",
    });
  }
});

test("parseCutoffFlagCommand parses quoted category values", () => {
  const result = parseCutoffFlagCommand(
    '--percentile 95 --year 2025 --category "Open Category (General)"',
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.command.category, "Open Category (General)");
  }
});

test("parseCutoffFlagCommand parses sc/st category values", () => {
  const result = parseCutoffFlagCommand(
    "--percentile=95 --category=sc/st --round=1",
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.command.category, "sc/st");
  }
});

test("parseCutoffFlagCommand parses legacy branch and course aliases", () => {
  const branchResult = parseCutoffFlagCommand(
    '--percentile 95 --branch "Computer Science & IT"',
  );
  const courseResult = parseCutoffFlagCommand("--percentile=95 --course=ai-ds");

  assert.equal(branchResult.ok, true);
  assert.equal(courseResult.ok, true);

  if (branchResult.ok) {
    assert.equal(branchResult.command.course, "Computer Science & IT");
  }

  if (courseResult.ok) {
    assert.equal(courseResult.command.course, "ai-ds");
  }
});

test("parseCutoffFlagCommand parses subcategory aliases", () => {
  const result = parseCutoffFlagCommand(
    "--percentile 95 --seat-type ladies-home",
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.command.subcategory, "ladies-home");
  }
});

test("parseCutoffFlagCommand rejects duplicate flags", () => {
  const result = parseCutoffFlagCommand("--percentile 95 --percentile 96");

  assert.equal(result.ok, false);
});

test("parseCutoffFlagCommand rejects duplicate branch and course filters", () => {
  const result = parseCutoffFlagCommand(
    "--percentile 95 --branch cs-it --course ai-ds",
  );

  assert.equal(result.ok, false);
});

test("parseCutoffFlagCommand requires percentile", () => {
  const result = parseCutoffFlagCommand("--year 2025 --round 1");

  assert.equal(result.ok, false);
});
