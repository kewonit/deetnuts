export const SUBJECTS = ["mathematics", "physics", "chemistry"] as const;

export const QUESTION_STATUSES = [
  "draft",
  "validated",
  "approved",
  "rejected",
  "archived",
] as const;

export const SOURCE_TYPES = [
  "official_notice",
  "official_mock",
  "candidate_export",
  "licensed_provider",
  "manual_entry",
  "test_fixture",
] as const;

export const ATTEMPT_STATUSES = [
  "in_progress",
  "submitted",
  "expired",
  "abandoned",
] as const;

export type MhtCetSubject = (typeof SUBJECTS)[number];
export type MhtCetQuestionStatus = (typeof QUESTION_STATUSES)[number];
export type MhtCetSourceType = (typeof SOURCE_TYPES)[number];
export type MhtCetAttemptStatus = (typeof ATTEMPT_STATUSES)[number];
