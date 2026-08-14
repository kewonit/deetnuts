/**
 * path helpers for /data lake — single source of truth for dataset layout
 * uniform pattern: data/datasets/{stream}/{exam_id}/{counselling_id}/{dataset}/year=YYYY/round=R/file.parquet
 * no exam-specific if-branches — layout is generic across all exams
 */

export type Stream = "engineering";

export const DATA_ROOT = "data";

export type CutoffPathArgs = {
  stream: Stream;
  exam_id: string;
  counselling_id: string;
  year: number;
  round: number;
};

export type SeatMatrixPathArgs = {
  stream: Stream;
  year: number;
};

/** canonical cutoff parquet path — uniform across all exams */
export function cutoffPath(args: CutoffPathArgs): string {
  return `${DATA_ROOT}/datasets/${args.stream}/${args.exam_id}/${args.counselling_id}/cutoffs/year=${args.year}/round=${args.round}/cutoffs.parquet`;
}

export function seatMatrixPath(args: SeatMatrixPathArgs): string {
  return `${DATA_ROOT}/datasets/${args.stream}/jee/josaa/seat-matrix/year=${args.year}/seat-matrix.parquet`;
}

export function referencePath(
  stream: Stream,
  kind: "institutes" | "programs",
): string {
  return `${DATA_ROOT}/reference/${stream}/${kind}.json`;
}

/**
 * expand a path_template from exam config data_dependencies
 * replaces {year} and {round} tokens with concrete values
 * unknown tokens are left as-is so callers can detect unresolved placeholders
 */
export function expandPathTemplate(
  template: string,
  vars: {
    year?: number;
    round?: number;
    [key: string]: string | number | undefined;
  },
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = vars[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}
