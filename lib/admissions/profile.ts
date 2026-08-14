import { z } from "zod";
import {
  MhtCetCandidateProfileSchema,
} from "@/lib/mht-cet/state-cutoffs/candidate-profile";

export const MhtCetAdmissionsProfileSchema = z
  .object({
    scoreMode: z.enum(["rank", "percentile"]),
    score: z.number().finite(),
    candidate: MhtCetCandidateProfileSchema,
  })
  .strict()
  .superRefine((profile, context) => {
    if (
      profile.scoreMode === "rank" &&
      (!Number.isInteger(profile.score) ||
        profile.score < 1 ||
        profile.score > 1_000_000)
    ) {
      context.addIssue({
        code: "custom",
        path: ["score"],
        message: "Rank must be an integer from 1 to 1,000,000",
      });
    }
    if (
      profile.scoreMode === "percentile" &&
      (profile.score < 0 || profile.score > 100)
    ) {
      context.addIssue({
        code: "custom",
        path: ["score"],
        message: "Percentile must be between 0 and 100",
      });
    }
  });

export const AdmissionsStoredProfileSchema = z
  .object({
    version: z.literal(1),
    system: z.literal("mht-cet"),
    profile: MhtCetAdmissionsProfileSchema,
  })
  .strict();

export const FitRequestV1Schema = z
  .object({
    version: z.literal(1),
    system: z.literal("mht-cet"),
    entity: z
      .object({
        kind: z.literal("college"),
        id: z.string().regex(/^\d{1,5}$/),
      })
      .strict(),
    year: z.number().int().min(2016).max(2100),
    round: z.number().int().min(1).max(10),
    profile: MhtCetAdmissionsProfileSchema,
  })
  .strict();

export type MhtCetAdmissionsProfile = z.infer<
  typeof MhtCetAdmissionsProfileSchema
>;
export type AdmissionsStoredProfile = z.infer<
  typeof AdmissionsStoredProfileSchema
>;
export type FitRequestV1 = z.infer<typeof FitRequestV1Schema>;

export function calculateRankMargin(
  candidateRank: number,
  closingRank: number,
): number {
  return closingRank - candidateRank;
}

export function calculatePercentileMargin(
  candidatePercentile: number,
  closingPercentile: number,
): number {
  return candidatePercentile - closingPercentile;
}
