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

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, result.css);
if (result.map) {
  await fs.writeFile(`${output}.map`, result.map.toString());
}

console.log(`Wrote ${path.relative(root, output)} (${result.css.length} bytes)`);
