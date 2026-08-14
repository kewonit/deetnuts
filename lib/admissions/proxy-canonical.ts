import manifest from "@/lib/admissions/canonical-manifest.generated.json";

const canonicalManifest = manifest as {
  mhtCetColleges: Record<string, string>;
};

export function getCanonicalMhtCetCollegePaths(): string[] {
  return [...new Set(Object.values(canonicalManifest.mhtCetColleges))].sort(
    (a, b) => a.localeCompare(b),
  );
}

function decodeSegment(value: string): string | null {
  try {
    return decodeURIComponent(value).trim().toLowerCase();
  } catch {
    return null;
  }
}

export function getAdmissionsCanonicalRedirectPath(
  pathname: string,
): string | null {
  const decision = getAdmissionsCanonicalRouteDecision(pathname);
  return decision?.type === "redirect" ? decision.pathname : null;
}

export type AdmissionsCanonicalRouteDecision =
  | { type: "redirect"; pathname: string }
  | { type: "not-found"; system: "mht-cet" };

export function getAdmissionsCanonicalRouteDecision(
  pathname: string,
): AdmissionsCanonicalRouteDecision | null {
  const segments = pathname.split("/").filter(Boolean);

  if (
    segments[0] === "mht-cet" &&
    segments[1] === "colleges" &&
    segments.length === 3
  ) {
    const decoded = decodeSegment(segments[2]);
    const match = decoded?.match(/(?:^|-)(\d{1,5})$/);
    if (!match) return { type: "not-found", system: "mht-cet" };
    const canonicalPath =
      canonicalManifest.mhtCetColleges[String(Number(match[1]))];
    if (!canonicalPath) return { type: "not-found", system: "mht-cet" };
    return canonicalPath !== pathname
      ? { type: "redirect", pathname: canonicalPath }
      : null;
  }

  if (
    segments[0] === "mht-cet" &&
    segments[1] === "colleges" &&
    segments.length > 2
  ) {
    return { type: "not-found", system: "mht-cet" };
  }

  return null;
}
