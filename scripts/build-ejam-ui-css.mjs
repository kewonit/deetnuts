import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webDir = path.join(root, "ejam/apps/web");
const webPackage = path.join(webDir, "package.json");
const requireFromWeb = createRequire(webPackage);
const postcss = requireFromWeb("postcss");
const tailwindcss = requireFromWeb("@tailwindcss/postcss");

const globals = path.join(root, "ejam/integrations/deetnuts-ui/globals.css");
const output = path.join(root, "public/ejam/ui.css");
const from = path.join(webDir, "deetnuts-ui-entry.css");

const css = `${await fs.readFile(globals, "utf8")}

@source "../../integrations/deetnuts-ui/**/*.{ts,tsx}";
@source "../../../components/ejam-chrome/**/*.{ts,tsx}";
@source "../../../components/jee-cutoffs/**/*.{ts,tsx}";
@source "../../../components/admissions/**/*.{ts,tsx}";
@source "../../../app/college-predictor/**/*.{ts,tsx}";
@source "../../../app/jee-cutoffs/**/*.{ts,tsx}";
@source "../../../app/jee-main/**/*.{ts,tsx}";
@source "../../../app/jee-advanced/**/*.{ts,tsx}";
@source "../../../app/mht-cet/**/*.{ts,tsx}";
@source "../../../components/CollegeGrid.tsx";
`;

const result = await postcss([tailwindcss()]).process(css, { from, to: output });

// eJam's utilities live in `@layer utilities`, so the host's unlayered Tailwind 3
// preflight and utilities win every conflict (a button loses its vertical padding,
// `lg:hidden` loses to `.flex`). The predictor is an eJam page end to end, so it also
// loads this copy: the same utilities, unlayered, scoped to the tool shell. `:where()`
// keeps their specificity unchanged, so the overrides in ejam-chrome.css still apply.
const TOOL_SCOPE = ":where(body:has([data-ejam-chrome=tool]))";
const toolOutput = path.join(root, "public/ejam/tool.css");
const tool = postcss.root();
result.root.walkAtRules("layer", (layer) => {
  if (layer.params !== "utilities" || !layer.nodes) return;
  for (const node of layer.nodes) tool.append(node.clone());
});
tool.walkRules((rule) => {
  // Nested rules (`&:hover`) inherit the scope from their parent; keyframe steps are not selectors.
  if (rule.parent?.type === "rule") return;
  if (rule.parent?.type === "atrule" && /keyframes$/.test(rule.parent.name)) return;
  rule.selectors = rule.selectors.map((selector) => `${TOOL_SCOPE} ${selector}`);
});
const toolCss = tool.toResult().css;

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, result.css);
await fs.writeFile(toolOutput, toolCss);
if (result.map) {
  await fs.writeFile(`${output}.map`, result.map.toString());
}

console.log(`Wrote ${path.relative(root, output)} (${result.css.length} bytes)`);
console.log(`Wrote ${path.relative(root, toolOutput)} (${toolCss.length} bytes)`);
