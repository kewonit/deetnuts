import * as path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/** monorepo root (data/, apps/, packages/) */
export const REPO_ROOT = path.resolve(PACKAGE_ROOT, "../..");
export const DATA_DIR = path.join(REPO_ROOT, "data");
