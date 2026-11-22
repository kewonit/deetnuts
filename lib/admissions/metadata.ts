import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/admissions/canonical";
import {
  getMhtCetCollegeMedia,
  type CollegeMediaAsset,
} from "@/lib/admissions/college-media";
import {
  headlineFigure,
  summarizeMhtCetCollege,
} from "@/lib/admissions/mht-cet-college-summary";
import type { MhtCetCollegeDetailModel } from "@/lib/admissions/types";

export function getMhtCetCollegeDocumentMetadata(
  model: MhtCetCollegeDetailModel,
) {
  const { top, programCount } = summarizeMhtCetCollege(model);
  const round = `${model.selectedYear} MHT-CET CAP Round ${model.selectedRound}`;
  const programs =
    programCount === 1 ? "1 program" : `${programCount} programs`;
  // Search snippets lead with the figure students are looking for.
  const description = top
    ? `${model.college.name} ${round} cutoffs: ${top.name} closed at ${headlineFigure(top)} for Open General. Closing percentile and rank for ${programs} and every seat category, from official CET Cell lists.`
    : `Review ${round} cutoff evidence, exact seat pools, programs, and explicitly dated seat information for ${model.college.name}.`;
  return {
    title: `${model.college.name} MHT-CET cutoffs ${model.selectedYear}`,
    description,
    canonical: getCanonicalUrl(model.canonicalPath),
  };
}

// Child openGraph and twitter objects replace the root ones, so the site preview is repeated here.
const SITE_PREVIEW_IMAGE =
  "https://res.cloudinary.com/dfyrk32ua/image/upload/v1722186653/deetnuts/preview_o5ykn7.png";

// A college's campus photo as its share image, or the site preview without one.
export function collegeShareImage(
  campus: CollegeMediaAsset | null | undefined,
  name: string,
) {
  return campus
    ? {
        url: getCanonicalUrl(campus.src),
        width: campus.width,
        height: campus.height,
        alt: name,
      }
    : { url: SITE_PREVIEW_IMAGE, width: 1200, height: 630, alt: "DEETNUTS" };
}

export function buildMhtCetCollegeMetadata(
  model: MhtCetCollegeDetailModel,
): Metadata {
  const { title, description, canonical } =
    getMhtCetCollegeDocumentMetadata(model);
  const image = collegeShareImage(
    getMhtCetCollegeMedia(model.college.collegeId)?.campus,
    model.college.name,
  );
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: "DEETNUTS",
      locale: "en_IN",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}
