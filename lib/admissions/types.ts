export type AdmissionsSystem = "mht-cet";

export type AdmissionsDataStatus = "ok" | "partial";

export interface DataProvenance {
  sourceName: string;
  year: number;
  round: number;
  sourceDocument?: string | null;
  sourcePage?: number | null;
  sourceUrl?: string | null;
  sourceHash?: string | null;
  note?: string;
}

export interface AdmissionsProgram {
  id: string;
  code: string;
  name: string;
  degreeType?: string;
  durationYears?: number;
  canonicalPath?: string;
}

export interface AdmissionsCutoffObservation {
  id: string;
  programId: string;
  programCode: string;
  programName: string;
  year: number;
  round: number;
  category: string;
  gender?: string | null;
  quota?: string | null;
  allocation?: string | null;
  openingValue?: number | null;
  closingValue: number;
  metric: "rank" | "percentile";
  rankValue?: number | null;
  percentileValue?: number | null;
  sourceDocument?: string | null;
  sourcePage?: number | null;
  sourceUrl?: string | null;
  sourceHash?: string | null;
}

export interface MhtCetCollegeIdentity {
  recordId?: string;
  collegeId: string;
  name: string;
  status?: string | null;
  homeUniversity?: string | null;
}

export interface MhtCetSeatMatrixRow {
  id: string;
  college_code: string;
  choice_code: string;
  course_name: string;
  seat_type: string;
  SI: number;
  MS_seats: number;
  all_india: number;
  institute_seats: number;
  minority_seats: number;
  CAP_seats: number;
  Total: number;
}

export interface MhtCetCollegeDetailModel {
  system: "mht-cet";
  kind: "college";
  status: AdmissionsDataStatus;
  canonicalPath: string;
  college: MhtCetCollegeIdentity;
  programs: AdmissionsProgram[];
  observations: AdmissionsCutoffObservation[];
  seatMatrix: MhtCetSeatMatrixRow[];
  availableYears: number[];
  availableRounds: number[];
  selectedYear: number;
  selectedRound: number;
  provenance: DataProvenance;
}

export type AdmissionsDetailModel = MhtCetCollegeDetailModel;

export type FitOutcome = "cleared" | "missed";

export interface FitObservation {
  id: string;
  programId: string;
  programCode: string;
  programName: string;
  seatPool: string;
  year: number;
  round: number;
  metric: "rank" | "percentile";
  candidateValue: number;
  closingValue: number;
  margin: number;
  outcome: FitOutcome;
  sourceDocument?: string | null;
  sourcePage?: number | null;
  sourceUrl?: string | null;
}

export interface HistoricalFitYear {
  year: number;
  comparable: boolean;
  cleared: boolean;
  bestMargin: number | null;
}

export interface HistoricalFitSummary {
  comparableYears: number;
  clearedYears: number;
  years: HistoricalFitYear[];
}

export interface FitResponseV1 {
  status: "ok" | "no-comparable-data" | "partial";
  observations: FitObservation[];
  history: HistoricalFitSummary | null;
  provenance: DataProvenance;
}
