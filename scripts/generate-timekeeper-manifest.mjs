import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const metadata = (await readJson("lib/timekeeper/exam-metadata.json")).metadata;
const preflight = await readJson("docs/timekeeper-migration/preflight.json");
const observedLandingPaths = await readJson("docs/timekeeper-migration/observed-paths.json");
const exams = Object.values(metadata);
const categories = [...new Set(exams.map((exam) => exam.category.toLowerCase().replace(/\s+/g, "-")))];
const routes = ["/", "/countdown", "/study-map", ...exams.map((exam) => `/exams/${exam.slug}`), ...categories.map((category) => `/category/${category}`)];
const redirects = Object.fromEntries(routes.map((path) => [path, `/exam-countdown${path === "/" ? "" : path}`]));
const aliases = {
  "/jeemains": "/exam-countdown/exams/jee-main",
  "/jeeadvanced": "/exam-countdown/exams/jee-advanced",
  "/neet": "/exam-countdown/exams/neet-ug",
  "/exams/jeemains": "/exam-countdown/exams/jee-main",
  "/exams/jeeadvanced": "/exam-countdown/exams/jee-advanced",
  "/exams/neet": "/exam-countdown/exams/neet-ug",
  "/custom/countdown": "/exam-countdown/countdown",
};
const manifest = {
  version: 1,
  sourceCommit: preflight.sourceCommit,
  oldOrigin: "https://timekeeper.edbn.me",
  newOrigin: "https://www.deetnuts.com",
  immutableSourceOrigin: preflight.cloudflare.immutableOrigin,
  counts: { exams: exams.length, categories: categories.length, pages: routes.length },
  redirects,
  aliases,
  gone: ["/example-usage"],
  knownMissing: ["/about", "/contact", "/privacy", "/terms", "/exams/${exam.slug}", "/exams/jee-main/2027", "/exams/jee-main/timekeeper"],
  observedLandingPaths,
};
const destination = new URL("docs/timekeeper-migration/manifest.json", root);
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
if (process.argv.includes("--check")) {
  if (await readFile(destination, "utf8") !== serialized) throw new Error("TimeKeeper manifest differs from its production route inventory. Regenerate and review it.");
} else await writeFile(destination, serialized);
console.log(`${fileURLToPath(destination)}: ${routes.length} pages, ${Object.keys(aliases).length} historical aliases`);
