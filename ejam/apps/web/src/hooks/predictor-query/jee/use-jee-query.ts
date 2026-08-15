"use client";

import { PredictionErrorResponse, type PredictionProvenance } from "@ejam/data";
import { useCallback, useEffect, useRef, useState } from "react";
import { predictorUsesQuotaHomeState } from "@/hooks/use-predictor-state";
import {
  buildJeePredictionRequest,
  decodePredictionSuccess,
  type PredictorDisplayResult,
} from "@/lib/predictor-adapters";
import type { PredictorQueryOptions, PredictorQueryResult } from "../types";

function readErrorMessage(body: unknown): string {
  const parsed = PredictionErrorResponse.safeParse(body);
  return parsed.success ? parsed.data.error.message : "Prediction failed";
}

function inputKey(options: PredictorQueryOptions): string {
  return JSON.stringify([
    options.predictorExamId,
    options.rank,
    options.apiSeatType,
    options.apiGender,
    options.quota,
    options.homeState,
    options.has_ews_certificate,
  ]);
}

export function useJeePredictorQuery(
  options: PredictorQueryOptions,
): PredictorQueryResult {
  const enabled = options.predictorExamId !== "mht-cet";
  const [data, setData] = useState<PredictorDisplayResult | null>(null);
  const [provenance, setProvenance] = useState<PredictionProvenance | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generationRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);
  const settledKeyRef = useRef<string | null>(null);
  const currentKey = inputKey(options);

  useEffect(() => {
    if (enabled && inFlightKeyRef.current === currentKey) {
      return;
    }
    generationRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    inFlightKeyRef.current = null;
    if (!enabled || settledKeyRef.current !== currentKey) {
      settledKeyRef.current = null;
      setData(null);
      setProvenance(null);
      setError(null);
      setIsLoading(false);
    }
  }, [currentKey, enabled]);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
    },
    [],
  );

  const trigger = useCallback(
    async (rankOverride?: string): Promise<boolean> => {
      const rank = rankOverride ?? options.rank;
      if (!enabled || !rank || Number.isNaN(Number(rank))) return false;

      const requestKey = JSON.stringify([
        options.predictorExamId,
        rank,
        options.apiSeatType,
        options.apiGender,
        options.quota,
        options.homeState,
        options.has_ews_certificate,
      ]);
      const generation = ++generationRef.current;
      const isCurrent = () => generation === generationRef.current;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      inFlightKeyRef.current = requestKey;
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/predict/${options.predictorExamId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              buildJeePredictionRequest({
                rank,
                apiSeatType: options.apiSeatType,
                apiGender: options.apiGender,
                quota: options.quota,
                homeState: options.homeState,
                hasEwsCertificate: options.has_ews_certificate,
                usesQuotaHomeState: predictorUsesQuotaHomeState(
                  options.predictorExamId,
                ),
              }),
            ),
            signal: controller.signal,
          },
        );
        const body: unknown = await response.json();
        if (!isCurrent()) return false;
        if (!response.ok) {
          settledKeyRef.current = requestKey;
          setError(readErrorMessage(body));
          return false;
        }
        const decoded = decodePredictionSuccess(options.predictorExamId, body);
        if (!decoded) {
          settledKeyRef.current = requestKey;
          setError("Prediction failed");
          return false;
        }
        settledKeyRef.current = requestKey;
        setData(decoded.result);
        setProvenance(decoded.provenance);
        return false;
      } catch (requestError) {
        if (
          requestError instanceof Error &&
          requestError.name === "AbortError"
        ) {
          return false;
        }
        if (isCurrent()) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Network error — please try again",
          );
        }
        return false;
      } finally {
        if (isCurrent() && controllerRef.current === controller) {
          setIsLoading(false);
          controllerRef.current = null;
          inFlightKeyRef.current = null;
        }
      }
    },
    [enabled, options],
  );

  return {
    data,
    provenance,
    isLoading,
    isUpdating: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    error,
    nextPageError: null,
    resultKey: currentKey,
    trigger,
    loadMore: async () => {},
  };
}
