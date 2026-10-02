import catalog from "@/ejam/data/tools/college-cutoffs/catalog.json";

// Resolve known hub and year aliases before Next renders a fallback static page.
// Cold fallback redirects can otherwise append the Location header twice.
export function getJeeCollegeCanonicalRedirectPath(
  pathname: string,
): string | null {
  const match = pathname.match(
    /^\/(jee-main|jee-advanced)\/colleges\/([^/]+)(?:\/cutoffs\/(\d+))?\/?$/,
  );
  if (!match) return null;
  const [, exam, slug, rawYear] = match;
  const college = catalog.colleges.find((entry) => entry.id === slug);
  if (!college || college.examId === exam) return null;
  if (
    rawYear !== undefined &&
    !college.pages.some((page) => page.year === Number(rawYear))
  )
    return null;
  return (
    "/" +
    college.examId +
    "/colleges/" +
    college.id +
    (rawYear !== undefined ? "/cutoffs/" + Number(rawYear) : "")
  );
}
