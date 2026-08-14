/** semver compare for manifest filenames like v0.1.0 — string sort breaks v0.10 vs v0.9 */

export function parseManifestVersion(version: string): number[] {
  const stripped = version.replace(/^v/, "");
  return stripped.split(".").map((part) => Number.parseInt(part, 10));
}

export function compareManifestVersions(a: string, b: string): number {
  const partsA = parseManifestVersion(a);
  const partsB = parseManifestVersion(b);
  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function sortManifestVersionsDesc(versions: string[]): string[] {
  return [...versions].sort((a, b) => compareManifestVersions(b, a));
}

export function pickLatestManifestFile(files: string[]): string | undefined {
  const versions = files
    .filter((f) => f.endsWith(".json") && f.startsWith("v"))
    .map((f) => f.replace(/\.json$/, ""));
  const latest = sortManifestVersionsDesc(versions)[0];
  return latest ? `${latest}.json` : undefined;
}

export function bumpPatchVersion(version: string): string {
  const parts = parseManifestVersion(version);
  while (parts.length < 3) parts.push(0);
  parts[parts.length - 1] += 1;
  return `v${parts.join(".")}`;
}
