"use client";

import { useJeePredictorQuery } from "./predictor-query/jee/use-jee-query";
import { useMhtCetPagedQuery } from "./predictor-query/mht-cet/use-mht-cet-query";
import type {
  PredictorQueryOptions,
  PredictorQueryResult,
} from "./predictor-query/types";

export function usePredictorQuery(
  options: Readonly<PredictorQueryOptions>,
): PredictorQueryResult {
  const jeeQuery = useJeePredictorQuery(options);
  const mhtQuery = useMhtCetPagedQuery(options);
  return options.predictorExamId === "mht-cet" ? mhtQuery : jeeQuery;
}
