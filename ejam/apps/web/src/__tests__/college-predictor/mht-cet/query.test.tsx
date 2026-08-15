// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMhtCetPagedQuery } from "@/hooks/predictor-query/mht-cet/use-mht-cet-query";
import type { PredictorQueryOptions } from "@/hooks/predictor-query/types";

const MHT_OPTIONS: PredictorQueryOptions = {
  predictorExamId: "mht-cet",
  rank: "10000",
  apiSeatType: "OPEN",
  apiGender: "Gender-Neutral",
  quota: "os",
  homeState: "",
  has_ews_certificate: false,
  include_all: false,
  mhtCandidatureType: "type-a",
  mhtCategory: "open",
  mhtLadiesSeatEligible: false,
  mhtHomeUniversity: "mumbai-university",
  mhtTfwsEligible: false,
  mhtPwdCategory: "",
  mhtOrphanCertificate: false,
  mhtMinorityCommunity: "",
  filters: {
    instituteTypes: new Set(),
    bands: new Set(),
  },
  sortBy: "chance",
  searchQuery: "",
};

const PAGE_RESPONSE = {
  ok: true,
  exam_id: "mht-cet",
  provenance: {
    exam_id: "mht-cet",
    manifest_version: "1.0.0",
    datasets_used: [
      {
        dataset: "predictor_index",
        path: "data/tools/college-predictor/maharashtra-cap/predictor-index.parquet",
        sha256: "a".repeat(64),
        role: "loaded",
      },
    ],
    generated_at: "2026-07-27T00:00:00.000Z",
  },
  result: {
    programs: [
      {
        institute_id: "mht-institute-01234",
        institute_code: "01234",
        institute_name: "Official Institute",
        institute_type: "Government",
        district: "Pune",
        offering_id: "mht-choice-0123412345",
        choice_code: "0123412345",
        program_id: "computer-engineering",
        program_name: "Computer Engineering",
        best_round: 3,
        best_eligible_seat_pool: {
          id: "mht-gopenh",
          source_code: "GOPENH",
          label: "GOPENH",
          source_stage_label: "I",
          stage_semantics_id: "standard",
          source_seat_scope_id: "home-university",
          effective_allocation_scope_id: "home-university",
          allocation_scope_id: "home-university",
          effective_eligibility_description:
            "Original seat-pool eligibility; effective candidate scope: home-university",
          round: 3,
        },
        seat_pools_considered: [
          {
            id: "mht-gopenh",
            source_code: "GOPENH",
            source_stage_label: "I",
            stage_semantics_id: "standard",
            source_seat_scope_id: "home-university",
            effective_allocation_scope_id: "home-university",
            allocation_scope_id: "home-university",
            eligible: true,
            rounds: [1, 3],
          },
        ],
        round_probabilities: {
          "1": 0.8,
          "2": null,
          "3": 0.9,
          "4": null,
        },
        round_matches: {
          "1": {
            probability: 0.8,
            predicted_closing_rank: 11_000,
            latest_historical_percentile: 97.5,
            seat_pool_id: "mht-gopenh",
            source_code: "GOPENH",
            source_seat_scope_id: "home-university",
            effective_allocation_scope_id: "home-university",
            allocation_scope_id: "home-university",
            stage: {
              source_label: "I",
              source_year: 2025,
              semantics_id: "standard",
              conversion_applied: false,
              description: "Original seat-pool eligibility",
              active_rule: {
                rules_year: 2026,
                stage_id: "stage-i",
                stage_label: "I",
              },
            },
            effective_eligibility_description:
              "Original seat-pool eligibility; effective candidate scope: home-university",
            data_quality: "inferred",
          },
          "2": null,
          "3": {
            probability: 0.9,
            predicted_closing_rank: 12_000,
            latest_historical_percentile: 97.1,
            seat_pool_id: "mht-gopenh",
            source_code: "GOPENH",
            source_seat_scope_id: "home-university",
            effective_allocation_scope_id: "home-university",
            allocation_scope_id: "home-university",
            stage: {
              source_label: "I",
              source_year: 2025,
              semantics_id: "standard",
              conversion_applied: false,
              description: "Original seat-pool eligibility",
              active_rule: {
                rules_year: 2026,
                stage_id: "stage-i",
                stage_label: "I",
              },
            },
            effective_eligibility_description:
              "Original seat-pool eligibility; effective candidate scope: home-university",
            data_quality: "inferred",
          },
          "4": null,
        },
        round_availability: {
          "1": { status: "available", reason: "Available." },
          "2": {
            status: "offering-not-published-for-maharashtra-cap",
            reason: "Not published.",
          },
          "3": { status: "available", reason: "Available." },
          "4": {
            status: "offering-not-published-for-maharashtra-cap",
            reason: "Not published.",
          },
        },
        overall_probability: 0.9,
        band: "safe",
        predicted_closing_rank: 12_000,
        latest_historical_percentile: 97.1,
        data_quality: "inferred",
      },
    ],
    metadata: {
      model_id: "mht-cap-empirical-v3",
      target_year: 2026,
      rules_year: 2026,
      source_years: [2024, 2025],
      total_matching_offerings: 1,
      displayed_offerings: 1,
      hidden_offerings: 0,
      warnings: ["Limited history."],
      pagination: {
        returned: 1,
        limit: 100,
        next_cursor: null,
        has_more: false,
      },
      facets: {
        institute_types: [{ value: "Government", count: 1 }],
        bands: {
          safe: 1,
          iffy: 0,
          delulu: 0,
          "doesnt-matter": 0,
        },
      },
    },
  },
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MHT-CET paged query isolation", () => {
  it("does not restore stale results after switching exams", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => PAGE_RESPONSE,
      })),
    );
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, rerender } = renderHook(
      ({ options }) => useMhtCetPagedQuery(options),
      {
        initialProps: { options: MHT_OPTIONS },
        wrapper,
      },
    );

    await act(async () => {
      await result.current.trigger();
    });
    await waitFor(() => expect(result.current.data).not.toBeNull());

    rerender({
      options: {
        ...MHT_OPTIONS,
        predictorExamId: "jee-main",
      },
    });
    expect(result.current.data).toBeNull();

    rerender({ options: MHT_OPTIONS });
    expect(result.current.data).toBeNull();
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.isUpdating).toBe(false);
  });

  it("keeps the active submission while include-all state catches up", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => ({
        ok: true,
        status: 200,
        json: async () => PAGE_RESPONSE,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, rerender } = renderHook(
      ({ options }) => useMhtCetPagedQuery(options),
      {
        initialProps: { options: MHT_OPTIONS },
        wrapper,
      },
    );

    await act(async () => {
      await result.current.trigger();
    });
    await waitFor(() => expect(result.current.data).not.toBeNull());

    await act(async () => {
      await result.current.trigger(undefined, { include_all: true });
    });
    rerender({
      options: {
        ...MHT_OPTIONS,
        include_all: true,
      },
    });

    await waitFor(() => expect(result.current.data).not.toBeNull());
    const lastRequest = fetchMock.mock.calls.at(-1)?.[1];
    expect(JSON.parse(String(lastRequest?.body))).toMatchObject({
      include_all: true,
      result_options: { limit: 100 },
    });
  });

  it("keeps the override rank while the URL rank catches up", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => ({
        ok: true,
        status: 200,
        json: async () => PAGE_RESPONSE,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const emptyRankOptions = { ...MHT_OPTIONS, rank: "" };
    const { result, rerender } = renderHook(
      ({ options }) => useMhtCetPagedQuery(options),
      {
        initialProps: { options: emptyRankOptions },
        wrapper,
      },
    );

    await act(async () => {
      await result.current.trigger("12345");
    });
    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(fetchMock).toHaveBeenCalled();

    rerender({ options: { ...MHT_OPTIONS, rank: "12345" } });
    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(
      JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)),
    ).toMatchObject({
      rank: 12345,
    });
  });

  it("clears results when the non-rank profile changes", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => ({
        ok: true,
        status: 200,
        json: async () => PAGE_RESPONSE,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, rerender } = renderHook(
      ({ options }) => useMhtCetPagedQuery(options),
      {
        initialProps: { options: MHT_OPTIONS },
        wrapper,
      },
    );

    await act(async () => {
      await result.current.trigger();
    });
    await waitFor(() => expect(result.current.data).not.toBeNull());

    rerender({
      options: {
        ...MHT_OPTIONS,
        mhtCategory: "obc",
      },
    });
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
