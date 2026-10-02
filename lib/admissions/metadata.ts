import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/admissions/canonical";
import type { MhtCetCollegeDetailModel } from "@/lib/admissions/types";

export function getMhtCetCollegeDocumentMetadata(
  model: MhtCetCollegeDetailModel,
) {
  return {
    title: model.college.name + " MHT-CET cutoffs",
    description:
      "Review " +
      model.selectedYear +
      " MHT-CET cutoff evidence, exact seat pools, programs, and explicitly dated seat information for " +
      model.college.name +
      ".",
    canonical: getCanonicalUrl(model.canonicalPath),
  };
}

export function buildMhtCetCollegeMetadata(
  model: MhtCetCollegeDetailModel,
): Metadata {
  const { title, description, canonical } =
    getMhtCetCollegeDocumentMetadata(model);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
  };
}
