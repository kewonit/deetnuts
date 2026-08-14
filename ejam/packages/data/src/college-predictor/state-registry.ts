/**
 * canonical state registry for HS/OS/special-state quota resolution
 * derives the set of valid state names from data/reference/engineering/institutes.json
 * so quota matching and API input validation share a single source of truth
 *
 * Node-only — uses node:fs synchronously and caches the result in a module-level set
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveRegistryRoot } from "../data-root";

type Institute = { id: string; state: string };

let _cachedStates: ReadonlySet<string> | null = null;

function institutesPath(): string {
  return resolve(resolveRegistryRoot(), "engineering", "institutes.json");
}

/**
 * load the canonical set of state names from institutes.json
 * the result is cached across calls within a process
 */
export function loadCanonicalStates(): ReadonlySet<string> {
  if (_cachedStates) return _cachedStates;
  const raw = readFileSync(institutesPath(), "utf-8");
  const institutes = JSON.parse(raw) as Institute[];
  _cachedStates = new Set(institutes.map((i) => i.state));
  return _cachedStates;
}

/** for tests only — drops the cached set so the next call re-reads the file */
export function _resetCanonicalStatesCache(): void {
  _cachedStates = null;
}
