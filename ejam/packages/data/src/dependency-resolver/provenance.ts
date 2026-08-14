/**
 * builds honest prediction provenance — only predictor_index is loaded at request time
 * cutoff files consumed at index build appear as linked entries via the lineage sidecar
 */

import type { PredictionProvenance } from "../predictor-interface";
import { readIndexLineageSidecar } from "./index-lineage";

export function buildPredictionProvenance(opts: {
  examId: string;
  manifestVersion: string;
  predictorIndex: { path: string; sha256: string };
}): PredictionProvenance {
  const lineage = readIndexLineageSidecar(opts.predictorIndex.path);
  const linkedCutoffs =
    lineage?.source_cutoffs.map((entry) => ({
      dataset: "cutoffs",
      path: entry.path,
      sha256: entry.sha256,
      role: "linked" as const,
    })) ?? [];
  const linkedReferences =
    lineage?.source_references?.map((entry) => ({
      dataset: entry.dataset,
      path: entry.path,
      sha256: entry.sha256,
      role: "linked" as const,
    })) ?? [];
  const linkedModelConfiguration = lineage?.model_configuration
    ? [
        {
          dataset: "model_configuration",
          path: lineage.model_configuration.path,
          sha256: lineage.model_configuration.sha256,
          role: "linked" as const,
        },
      ]
    : [];

  return {
    exam_id: opts.examId,
    manifest_version: opts.manifestVersion,
    datasets_used: [
      {
        dataset: "predictor_index",
        path: opts.predictorIndex.path,
        sha256: opts.predictorIndex.sha256,
        role: "loaded",
      },
      ...linkedCutoffs,
      ...linkedReferences,
      ...linkedModelConfiguration,
    ],
    ...(lineage ? { index_lineage: lineage.source_cutoffs } : {}),
    generated_at: new Date().toISOString(),
  };
}
