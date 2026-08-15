/**
 * central state for the multi-exam college predictor
 * prediction inputs live in URL search params for shareable links
 *
 * the URL key for the EWS certificate flag is the short `ews` for compact links
 * the TypeScript field name is `has_ews_certificate` to reflect what the student is actually asserting
 */

"use client";

import type {
  MhtCetCandidatureType,
  MhtCetCategoryId,
  MhtCetHomeUniversityId,
  MhtCetMinorityCommunityId,
  MhtCetPwdCategoryId,
} from "@ejam/data/mht-cet/browser";
import {
  MHT_CET_HOME_UNIVERSITIES_2026,
  MHT_CET_MINORITY_COMMUNITIES_2026,
  MHT_CET_PWD_CATEGORIES_2026,
} from "@ejam/data/mht-cet/browser";
import { type ReadonlyURLSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { PredictorExamId } from "@/lib/predictor-adapters";

export type ExamType = "jee-advanced" | "jee-main" | "mht-cet";

/** JoSAA / CSAB counselling body — only applies when exam is jee-main */
export type CounsellingBody = "josaa" | "csab";

const COUNSELLING_BODIES = new Set<CounsellingBody>(["josaa", "csab"]);
const MHT_CANDIDATURE_TYPES = new Set<MhtCetCandidatureType>([
  "type-a",
  "type-b",
  "type-c",
  "type-d",
  "type-e",
]);
const MHT_CATEGORIES = new Set<MhtCetCategoryId>([
  "open",
  "sc",
  "st",
  "vj-dt",
  "nt-b",
  "nt-c",
  "nt-d",
  "obc",
  "sebc",
]);
const MHT_PWD_CATEGORIES = new Set<MhtCetPwdCategoryId>(
  MHT_CET_PWD_CATEGORIES_2026.map((entry) => entry.id),
);
const MHT_HOME_UNIVERSITIES = new Set<MhtCetHomeUniversityId>(
  MHT_CET_HOME_UNIVERSITIES_2026.map((entry) => entry.id),
);
const MHT_MINORITY_COMMUNITIES = new Set<MhtCetMinorityCommunityId>(
  MHT_CET_MINORITY_COMMUNITIES_2026.map((entry) => entry.id),
);

export function parseCounsellingBody(raw: string | null): CounsellingBody {
  if (raw && COUNSELLING_BODIES.has(raw as CounsellingBody)) {
    return raw as CounsellingBody;
  }
  return "josaa";
}

function parseMhtCandidatureType(raw: string | null): MhtCetCandidatureType {
  return raw && MHT_CANDIDATURE_TYPES.has(raw as MhtCetCandidatureType)
    ? (raw as MhtCetCandidatureType)
    : "type-a";
}

function parseMhtCategory(raw: string | null): MhtCetCategoryId {
  return raw && MHT_CATEGORIES.has(raw as MhtCetCategoryId)
    ? (raw as MhtCetCategoryId)
    : "open";
}

function parseMhtPwdCategory(raw: string | null): MhtCetPwdCategoryId | "" {
  return raw && MHT_PWD_CATEGORIES.has(raw as MhtCetPwdCategoryId)
    ? (raw as MhtCetPwdCategoryId)
    : "";
}

function parseMhtHomeUniversity(
  raw: string | null,
): MhtCetHomeUniversityId | "" {
  return raw && MHT_HOME_UNIVERSITIES.has(raw as MhtCetHomeUniversityId)
    ? (raw as MhtCetHomeUniversityId)
    : "";
}

function parseMhtMinorityCommunity(
  raw: string | null,
): MhtCetMinorityCommunityId | "" {
  return raw && MHT_MINORITY_COMMUNITIES.has(raw as MhtCetMinorityCommunityId)
    ? (raw as MhtCetMinorityCommunityId)
    : "";
}

export function counsellingToPredictorExam(
  exam: ExamType,
  counselling: CounsellingBody,
): PredictorExamId {
  if (exam === "mht-cet") return "mht-cet";
  if (exam === "jee-advanced") return "jee-advanced";
  if (counselling === "csab") return "csab";
  return "jee-main";
}

export function isJeeMainCounselling(exam: ExamType): boolean {
  return exam === "jee-main";
}

export function predictorUsesQuotaHomeState(
  predictorExamId: PredictorExamId,
): boolean {
  return predictorExamId === "jee-main" || predictorExamId === "csab";
}

const CATEGORY_TO_SEAT_TYPE: Record<string, string> = {
  gen: "OPEN",
  "gen-ews": "EWS",
  "obc-ncl": "OBC-NCL",
  sc: "SC",
  st: "ST",
};

const GENDER_TO_API: Record<string, string> = {
  neutral: "Gender-Neutral",
  female: "Female-only (including Supernumerary)",
};

export interface PredictorInputState {
  rank: string;
  exam: ExamType;
  counselling: CounsellingBody;
  category: string;
  gender: string;
  quota: string;
  homeState: string;
  has_ews_certificate: boolean;
  include_all: boolean;
  mhtCandidatureType: MhtCetCandidatureType;
  mhtCategory: MhtCetCategoryId;
  mhtLadiesSeatEligible: boolean;
  mhtHomeUniversity: MhtCetHomeUniversityId | "";
  mhtTfwsEligible: boolean;
  mhtPwdCategory: MhtCetPwdCategoryId | "";
  mhtOrphanCertificate: boolean;
  mhtMinorityCommunity: MhtCetMinorityCommunityId | "";
}

export interface PredictorStateReturn extends PredictorInputState {
  setRank: (v: string) => void;
  setExam: (v: ExamType) => void;
  setCounselling: (v: CounsellingBody) => void;
  setCategory: (v: string) => void;
  setGender: (v: string) => void;
  setQuota: (v: string) => void;
  setHomeState: (v: string) => void;
  setHasEwsCertificate: (v: boolean) => void;
  setIncludeAll: (v: boolean) => void;
  setMhtCandidatureType: (v: MhtCetCandidatureType) => void;
  setMhtCategory: (v: MhtCetCategoryId) => void;
  setMhtLadiesSeatEligible: (v: boolean) => void;
  setMhtHomeUniversity: (v: MhtCetHomeUniversityId | "") => void;
  setMhtTfwsEligible: (v: boolean) => void;
  setMhtPwdCategory: (v: MhtCetPwdCategoryId | "") => void;
  setMhtOrphanCertificate: (v: boolean) => void;
  setMhtMinorityCommunity: (v: MhtCetMinorityCommunityId | "") => void;
  apiSeatType: string;
  apiGender: string;
  predictorExamId: PredictorExamId;
}

export function usePredictorState(
  params: ReadonlyURLSearchParams,
): PredictorStateReturn {
  const router = useRouter();

  const rank = params.get("rank") ?? "";
  const rawExam = params.get("exam");
  const urlExam: ExamType =
    rawExam === "jee-advanced" || rawExam === "mht-cet" ? rawExam : "jee-main";
  const [exam, setOptimisticExam] = useState<ExamType>(urlExam);
  useEffect(() => {
    setOptimisticExam(urlExam);
  }, [urlExam]);
  const counselling = parseCounsellingBody(params.get("counselling"));
  const category = params.get("category") ?? "gen";
  const gender = params.get("gender") ?? "neutral";
  const quota = params.get("quota") ?? "os";
  const homeState = params.get("state") ?? "";
  const has_ews_certificate = params.get("ews") === "true";
  const include_all = params.get("include_all") === "true";
  const mhtCandidatureType = parseMhtCandidatureType(
    params.get("mht_candidature"),
  );
  const mhtCategory = parseMhtCategory(params.get("mht_category"));
  const mhtLadiesSeatEligible = params.get("mht_ladies") === "true";
  const mhtHomeUniversity = parseMhtHomeUniversity(
    params.get("mht_home_university"),
  );
  const mhtTfwsEligible = params.get("mht_tfws") === "true";
  const mhtPwdCategory = parseMhtPwdCategory(params.get("mht_pwd"));
  const mhtOrphanCertificate = params.get("mht_orphan") === "true";
  const mhtMinorityCommunity = parseMhtMinorityCommunity(
    params.get("mht_minority"),
  );

  const updateParam = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      router.replace(`?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  const setRank = useCallback(
    (v: string) => updateParam({ rank: v }),
    [updateParam],
  );
  const setExam = useCallback(
    (v: ExamType) => {
      if (v === exam) return;

      setOptimisticExam(v);
      updateParam({
        exam: v,
        rank: null,
        category: null,
        gender: null,
        quota: null,
        state: null,
        counselling: null,
        ews: null,
        mht_candidature: null,
        mht_category: null,
        mht_ladies: null,
        mht_home_university: null,
        mht_tfws: null,
        mht_pwd: null,
        mht_orphan: null,
        mht_minority: null,
      });
    },
    [exam, updateParam],
  );
  const setCounselling = useCallback(
    (v: CounsellingBody) => updateParam({ counselling: v }),
    [updateParam],
  );
  const setCategory = useCallback(
    (v: string) => updateParam({ category: v }),
    [updateParam],
  );
  const setGender = useCallback(
    (v: string) => updateParam({ gender: v }),
    [updateParam],
  );
  const setQuota = useCallback(
    (v: string) => updateParam({ quota: v }),
    [updateParam],
  );
  const setHasEwsCertificate = useCallback(
    (v: boolean) => updateParam({ ews: v ? "true" : null }),
    [updateParam],
  );
  const setIncludeAll = useCallback(
    (v: boolean) => updateParam({ include_all: v ? "true" : "false" }),
    [updateParam],
  );

  const setHomeState = useCallback(
    (v: string) => updateParam({ state: v }),
    [updateParam],
  );
  const setMhtCandidatureType = useCallback(
    (v: MhtCetCandidatureType) =>
      updateParam({
        mht_candidature: v,
        ...(v !== "type-a" && v !== "type-b"
          ? {
              mht_minority: null,
            }
          : {}),
        ...(v === "type-e"
          ? {
              mht_home_university: null,
              mht_pwd: null,
            }
          : {}),
      }),
    [updateParam],
  );
  const setMhtCategory = useCallback(
    (v: MhtCetCategoryId) =>
      updateParam({
        mht_category: v,
        ...(v !== "open" ? { ews: null } : {}),
      }),
    [updateParam],
  );
  const setMhtLadiesSeatEligible = useCallback(
    (v: boolean) => updateParam({ mht_ladies: v ? "true" : null }),
    [updateParam],
  );
  const setMhtHomeUniversity = useCallback(
    (v: MhtCetHomeUniversityId | "") => updateParam({ mht_home_university: v }),
    [updateParam],
  );
  const setMhtTfwsEligible = useCallback(
    (v: boolean) => updateParam({ mht_tfws: v ? "true" : null }),
    [updateParam],
  );
  const setMhtPwdCategory = useCallback(
    (v: MhtCetPwdCategoryId | "") => updateParam({ mht_pwd: v }),
    [updateParam],
  );
  const setMhtOrphanCertificate = useCallback(
    (v: boolean) => updateParam({ mht_orphan: v ? "true" : null }),
    [updateParam],
  );
  const setMhtMinorityCommunity = useCallback(
    (v: MhtCetMinorityCommunityId | "") => updateParam({ mht_minority: v }),
    [updateParam],
  );

  return {
    rank,
    exam,
    counselling,
    category,
    gender,
    quota,
    homeState,
    has_ews_certificate,
    include_all,
    mhtCandidatureType,
    mhtCategory,
    mhtLadiesSeatEligible,
    mhtHomeUniversity,
    mhtTfwsEligible,
    mhtPwdCategory,
    mhtOrphanCertificate,
    mhtMinorityCommunity,
    setRank,
    setExam,
    setCounselling,
    setCategory,
    setGender,
    setQuota,
    setHomeState,
    setHasEwsCertificate,
    setIncludeAll,
    setMhtCandidatureType,
    setMhtCategory,
    setMhtLadiesSeatEligible,
    setMhtHomeUniversity,
    setMhtTfwsEligible,
    setMhtPwdCategory,
    setMhtOrphanCertificate,
    setMhtMinorityCommunity,
    apiSeatType: CATEGORY_TO_SEAT_TYPE[category] ?? "OPEN",
    apiGender: GENDER_TO_API[gender] ?? "Gender-Neutral",
    predictorExamId: counsellingToPredictorExam(exam, counselling),
  };
}
