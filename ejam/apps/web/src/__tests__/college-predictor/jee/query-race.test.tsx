// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useJeePredictorQuery } from "@/hooks/predictor-query/jee/use-jee-query";
import type { PredictorQueryOptions } from "@/hooks/predictor-query/types";

const OPTIONS: PredictorQueryOptions = {
  predictorExamId: "jee-main",
  rank: "",
  apiSeatType: "OPEN",
  apiGender: "Gender-Neutral",
  quota: "os",
  homeState: "Maharashtra",
  has_ews_certificate: false,
  include_all: true,
  mhtCandidatureType: "type-a",
  mhtCategory: "open",
  mhtLadiesSeatEligible: false,
  mhtHomeUniversity: "",
  mhtTfwsEligible: false,
  mhtPwdCategory: "",
  mhtOrphanCertificate: false,
  mhtMinorityCommunity: "",
  filters: { instituteTypes: new Set(), bands: new Set() },
  sortBy: "balanced",
  searchQuery: "",
};

function deferredFetch() {
  let resolveResponse!: (value: {
    ok: boolean;
    json: () => Promise<unknown>;
  }) => void;
  const response = new Promise<{
    ok: boolean;
    json: () => Promise<unknown>;
  }>((resolve) => {
    resolveResponse = resolve;
  });
  const fetchMock = vi.fn(
    (_input: RequestInfo | URL, _init?: RequestInit) => response,
  );
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, resolveResponse };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("JEE request synchronization", () => {
  it("does not abort when the URL catches up to the submitted rank", async () => {
    const request = deferredFetch();
    const { result, rerender } = renderHook(
      ({ options }) => useJeePredictorQuery(options),
      { initialProps: { options: OPTIONS } },
    );

    let completion!: Promise<boolean>;
    act(() => {
      completion = result.current.trigger("12345");
    });
    const signal = request.fetchMock.mock.calls[0]?.[1]?.signal as AbortSignal;

    rerender({ options: { ...OPTIONS, rank: "12345" } });
    expect(signal.aborted).toBe(false);

    request.resolveResponse({
      ok: false,
      json: async () => ({
        ok: false,
        error: { code: "INVALID_INPUT", message: "fixture" },
      }),
    });
    await act(async () => {
      await completion;
    });
  });

  it("aborts when a different profile key replaces the active request", () => {
    const request = deferredFetch();
    const { result, rerender } = renderHook(
      ({ options }) => useJeePredictorQuery(options),
      { initialProps: { options: { ...OPTIONS, rank: "12345" } } },
    );

    act(() => {
      void result.current.trigger();
    });
    const signal = request.fetchMock.mock.calls[0]?.[1]?.signal as AbortSignal;

    rerender({
      options: {
        ...OPTIONS,
        rank: "12345",
        apiSeatType: "OBC-NCL",
      },
    });
    expect(signal.aborted).toBe(true);
  });
});
