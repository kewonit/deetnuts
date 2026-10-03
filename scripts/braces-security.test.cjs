const assert = require("node:assert/strict");
const { mkdtempSync, realpathSync, rmSync, writeFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const { tmpdir } = require("node:os");
const path = require("node:path");
const test = require("node:test");
const braces = require("braces");

const stringMethods = [
  (pattern) => braces(pattern),
  (pattern) => braces(pattern, { expand: true }),
  (pattern) => braces.create(pattern),
  (pattern) => braces.parse(pattern),
  (pattern) => braces.compile(pattern),
  (pattern) => braces.expand(pattern),
  (pattern) => braces.stringify(pattern),
];
const depthError = { name: "RangeError", code: "BRACES_MAX_DEPTH" };

function nestedPattern(depth, mixed = false) {
  let opening = "";
  let closing = "";
  for (let i = 0; i < depth; i++) {
    const paren = mixed && i % 2 === 1;
    opening += paren ? "(" : "{";
    closing = (paren ? ")" : "}") + closing;
  }
  return opening + "x" + closing;
}

function nestedAst(depth) {
  const root = { type: "root", nodes: [] };
  let parent = root;
  for (let i = 0; i < depth; i++) {
    const node = { type: "paren", nodes: [], parent };
    parent.nodes.push(node);
    parent = node;
  }
  parent.nodes.push({ type: "text", value: "x", parent });
  return root;
}

test("deep brace, parenthesis and mixed patterns fail before exhausting the stack", () => {
  for (const depth of [101, 4998]) {
    const bracePattern = nestedPattern(depth);
    const patterns = [
      bracePattern,
      "(".repeat(depth) + "x" + ")".repeat(depth),
      nestedPattern(depth, true),
      "{".repeat(depth) + "x",
      "(".repeat(depth) + "x",
    ];
    assert.ok(bracePattern.length < 10000);
    for (const pattern of patterns) {
      for (const method of stringMethods) {
        assert.throws(() => method(pattern), depthError);
      }
    }
  }
});

test("the supported nesting boundary still compiles and expands", () => {
  for (const pattern of [nestedPattern(100), nestedPattern(100, true)]) {
    assert.equal(braces.compile(pattern), pattern);
    assert.deepEqual(braces.expand(pattern), [pattern]);
    assert.equal(braces.stringify(pattern), pattern);
  }
});

test("direct AST callers cannot bypass the recursive walk guards", () => {
  for (const method of ["compile", "expand", "stringify"]) {
    assert.deepEqual(
      braces[method](nestedAst(100)),
      method === "expand" ? ["x"] : "x",
    );
    for (const depth of [101, 10000]) {
      assert.throws(() => braces[method](nestedAst(depth)), depthError);
    }
  }
});

test("literal braces in quotes, character classes and escapes remain valid", () => {
  const literal = "{".repeat(101) + "x" + "}".repeat(101);
  for (const [pattern, expected] of [
    ['"' + literal + '"', literal],
    ["[" + literal + "]", "[" + literal + "]"],
    ["\\{".repeat(101) + "x" + "\\}".repeat(101), literal],
  ]) {
    assert.equal(braces.compile(pattern), expected);
    assert.deepEqual(braces.expand(pattern), [expected]);
    assert.equal(braces.stringify(pattern), expected);
  }
});

test("ordinary brace alternatives, ranges and invalid braces keep their outputs", () => {
  const cases = [
    ["a/{b,c}/d", "a/(b|c)/d", ["a/b/d", "a/c/d"]],
    ["{1..5}", "([1-5])", ["1", "2", "3", "4", "5"]],
    ["{05..01..2}", "(01|03|05)", ["05", "03", "01"]],
    ["{a..e..2}", "(a|c|e)", ["a", "c", "e"]],
    ["{a,b,{c,d}}", "(a|b|(c|d))", ["a", "b", "c", "d"]],
    ["{a,b}{1,2}", "(a|b)(1|2)", ["a1", "a2", "b1", "b2"]],
    ["{a,{b,{c}}}", "(a|(b|{c}))", ["a", "b", "{c}"]],
    ["{{a}}", "{{a}}", ["{{a}}"]],
    ["{{x}y}", "{{x}y}", ["{{x}y}"]],
    ["{}{a}", "{}{a}", ["{}{a}"]],
  ];
  for (const [pattern, compiled, expanded] of cases) {
    assert.equal(braces.compile(pattern), compiled);
    assert.deepEqual(braces.expand(pattern), expanded);
    assert.equal(braces.stringify(pattern, { escapeInvalid: true }), pattern);
  }
  assert.deepEqual(braces.expand("{a,,a}", { nodupes: true, noempty: true }), [
    "a",
  ]);
});

test("glob and watcher consumers resolve the patched parser", () => {
  const patchedPath = realpathSync(require.resolve("braces"));
  assert.equal(
    patchedPath,
    path.resolve(__dirname, "../vendor/braces/index.js"),
  );
  for (const consumer of ["chokidar", "micromatch"]) {
    const consumerRequire = createRequire(require.resolve(consumer));
    assert.equal(realpathSync(consumerRequire.resolve("braces")), patchedPath);
  }
  const micromatch = require("micromatch");
  assert.throws(() => micromatch.braceExpand(nestedPattern(4998)), depthError);
  assert.deepEqual(
    micromatch(["logo.webp", "campus.webp", "notes.md"], "{logo,campus}.webp"),
    ["logo.webp", "campus.webp"],
  );
});

test(
  "fast-glob and chokidar still discover brace-selected files",
  { timeout: 10000 },
  async () => {
    const cwd = mkdtempSync(path.join(tmpdir(), "deetnuts-braces-"));
    let watcher;
    try {
      for (const file of ["logo.webp", "campus.webp", "notes.md"]) {
        writeFileSync(path.join(cwd, file), "fixture");
      }
      assert.deepEqual(
        require("fast-glob").sync("{logo,campus}.webp", { cwd }).sort(),
        ["campus.webp", "logo.webp"],
      );
      const found = [];
      watcher = require("chokidar").watch("{logo,campus}.webp", { cwd });
      await new Promise((resolve, reject) => {
        watcher.on("add", (file) => found.push(file));
        watcher.once("error", reject);
        watcher.once("ready", resolve);
      });
      assert.deepEqual(found.sort(), ["campus.webp", "logo.webp"]);
    } finally {
      if (watcher) await watcher.close();
      rmSync(cwd, { recursive: true, force: true });
    }
  },
);
