"use client";

import {
  Suspense,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  useQueryState,
  useQueryStates,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  parseAsStringLiteral,
} from "nuqs";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import MhtPill from "@/components/admissions/MhtPill";
import {
  FilterSidebar,
  type FilterSidebarProps,
} from "./components/FilterSidebar";
import { LoginRequiredDialog } from "./components/LoginRequiredDialog";
import { MobileFilterToast } from "./components/MobileFilterToast";
import {
  QueryBar,
  nextQueryStep,
  queryStepMessage,
} from "./components/QueryBar";
import { TopToolbar } from "./components/TopToolbar";
import "@/components/admissions/mht-tool.css";
import { useCutoffData } from "./hooks/use-cutoff-data";
import { recordAnonymousStateCutoffAction } from "./anonymous-usage";
import { DEFAULT_YEAR, ROUNDS_BY_YEAR, YEAR_OPTIONS } from "./constants";
import {
  MHT_CET_CANDIDATURE_IDS,
  MHT_CET_CATEGORY_IDS,
  MHT_CET_HOME_UNIVERSITY_IDS,
  MHT_CET_MINORITY_IDS,
  MhtCetCandidateProfileSchema,
  deriveEligibleSeatPools,
  groupEligibleSeatPoolCodes,
  isCandidateScoreValid,
  type MhtCetCandidatureType,
  type MhtCetCategoryId,
  type MhtCetHomeUniversityId,
  type MhtCetMinorityCommunityId,
} from "@/lib/mht-cet/state-cutoffs/candidate-profile";
import { getClampedPage } from "./pagination";
import { shouldAutoDismissMobileFilterToast } from "./mobile-filter-toast-controller";

// The table loads after the controls so the first paint stays light.
const DataTable = dynamic(
  () => import("./components/DataTable").then((mod) => mod.DataTable),
  {
    loading: () => (
      <div className="mht-card mht-data-card mht-skeleton mht-data-placeholder" />
    ),
    ssr: false,
  },
);

// Default visible columns
const DEFAULT_COLUMNS = [
  "college_name",
  "course_name",
  "category",
  "last_rank",
  "cutoff_score",
  "total_admitted",
];

// Main Page Content Component
function StateCutoffsContent() {
  const searchParams = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [loginGateOpen, setLoginGateOpen] = useState(false);
  const [loginRedirectTo, setLoginRedirectTo] = useState(
    "/mht-cet/state-cutoffs",
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // URL State with nuqs
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [courses, setCourses] = useQueryState(
    "courses",
    parseAsArrayOf(parseAsString, ",").withDefault([]),
  );
  const [statuses, setStatuses] = useQueryState(
    "statuses",
    parseAsArrayOf(parseAsString, ",").withDefault([]),
  );
  const [universities, setUniversities] = useQueryState(
    "universities",
    parseAsArrayOf(parseAsString, ",").withDefault([]),
  );
  const [profileParams, setProfileParams] = useQueryStates(
    {
      percentile: parseAsString.withDefault(""),
      scoreMode: parseAsStringLiteral([
        "percentile",
        "rank",
      ] as const).withDefault("rank"),
      rank: parseAsString.withDefault(""),
      year: parseAsInteger.withDefault(DEFAULT_YEAR),
      round: parseAsInteger.withDefault(1),
      mht_candidature: parseAsStringLiteral(MHT_CET_CANDIDATURE_IDS),
      mht_home_university: parseAsStringLiteral(MHT_CET_HOME_UNIVERSITY_IDS),
      mht_category: parseAsStringLiteral(MHT_CET_CATEGORY_IDS),
      mht_ladies: parseAsBoolean,
      ews: parseAsBoolean.withDefault(false),
      mht_tfws: parseAsBoolean.withDefault(false),
      mht_pwd: parseAsBoolean.withDefault(false),
      mht_orphan: parseAsBoolean.withDefault(false),
      mht_minority: parseAsStringLiteral(MHT_CET_MINORITY_IDS),
      categories: parseAsArrayOf(parseAsString, ",").withDefault([]),
      page: parseAsInteger.withDefault(1),
    },
    { history: "replace" },
  );
  const year = profileParams.year;
  const round = profileParams.round;
  const percentile = profileParams.percentile;
  const scoreMode =
    !searchParams.has("scoreMode") && percentile
      ? "percentile"
      : profileParams.scoreMode;
  const rank = profileParams.rank;
  const categories = profileParams.categories;
  const page = profileParams.page;
  const setPage = useCallback(
    (value: number | null) => setProfileParams({ page: value }),
    [setProfileParams],
  );
  const [perPage, setPerPage] = useQueryState(
    "perPage",
    parseAsInteger.withDefault(25),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsString.withDefault("cutoff_score"),
  );
  const [sortOrder, setSortOrder] = useQueryState(
    "sortOrder",
    parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),
  );

  // Local state for column visibility
  const [visibleColumns, setVisibleColumns] =
    useState<string[]>(DEFAULT_COLUMNS);

  // Data fetching hook
  const {
    records,
    totalItems,
    loading,
    paginationLoading,
    hasFetched,
    searchInsight,
    profileMetadata,
    error,
    fetchData,
    clearCache,
  } = useCutoffData();

  // Debounce refs
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<string>("");
  const pendingUserFetchActionRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : { user: null }))
      .then((data: { user?: unknown }) => {
        setIsAuthenticated(Boolean(data.user));
      })
      .catch(() => {
        if (!controller.signal.aborted) setIsAuthenticated(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  const getCurrentRedirectPath = useCallback(() => {
    if (typeof window === "undefined") {
      return "/mht-cet/state-cutoffs";
    }

    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }, []);

  const openLoginGate = useCallback(() => {
    setLoginRedirectTo(getCurrentRedirectPath());
    setLoginGateOpen(true);
  }, [getCurrentRedirectPath]);

  const guardAnonymousAction = useCallback(() => {
    if (isAuthenticated !== false) {
      return true;
    }

    const usage = recordAnonymousStateCutoffAction({
      isAuthenticated: false,
    });

    if (!usage.allowed) {
      openLoginGate();
      return false;
    }

    return true;
  }, [isAuthenticated, openLoginGate]);

  const markResultAction = useCallback(() => {
    pendingUserFetchActionRef.current = true;
  }, []);

  useEffect(() => {
    if (error?.toLowerCase().includes("please login to continue")) {
      openLoginGate();
    }
  }, [error, openLoginGate]);

  const scoreValue = scoreMode === "rank" ? rank : percentile;
  const scoreIsValid = useMemo(
    () => isCandidateScoreValid(scoreMode, scoreValue),
    [scoreMode, scoreValue],
  );
  const parsedCandidateProfile = useMemo(
    () =>
      MhtCetCandidateProfileSchema.safeParse({
        candidatureType: profileParams.mht_candidature,
        homeUniversityId:
          profileParams.mht_candidature === "type-e"
            ? undefined
            : (profileParams.mht_home_university ?? undefined),
        categoryId: profileParams.mht_category,
        ladiesSeatEligible: profileParams.mht_ladies,
        eligibilities: {
          ewsCertificate: profileParams.ews,
          tfwsEligible: profileParams.mht_tfws,
          pwd: profileParams.mht_pwd,
          orphanCertificate: profileParams.mht_orphan,
          minorityCommunityId: profileParams.mht_minority ?? undefined,
        },
      }),
    [profileParams],
  );
  const candidateProfile = parsedCandidateProfile.success
    ? parsedCandidateProfile.data
    : null;
  const profileReady = candidateProfile !== null;
  const derivedSeatPools = useMemo(
    () =>
      candidateProfile
        ? deriveEligibleSeatPools(candidateProfile, categories)
        : null,
    [candidateProfile, categories],
  );
  const eligibleSeatPoolGroups = useMemo(
    () =>
      candidateProfile
        ? groupEligibleSeatPoolCodes(
            deriveEligibleSeatPools(candidateProfile).categoryCodes,
          )
        : {},
    [candidateProfile],
  );

  useEffect(() => {
    const incompatibleProfileValues: {
      year?: number;
      round?: number;
      mht_home_university?: null;
      mht_pwd?: false;
      mht_minority?: null;
      ews?: false;
      categories?: null;
      page?: number;
    } = {};

    if (!ROUNDS_BY_YEAR[year]) {
      incompatibleProfileValues.year = DEFAULT_YEAR;
      incompatibleProfileValues.round = 1;
    } else if (!ROUNDS_BY_YEAR[year].includes(round)) {
      incompatibleProfileValues.round = 1;
    }
    if (profileParams.mht_candidature === "type-e") {
      if (profileParams.mht_home_university) {
        incompatibleProfileValues.mht_home_university = null;
      }
      if (profileParams.mht_pwd) {
        incompatibleProfileValues.mht_pwd = false;
      }
    }
    if (
      profileParams.mht_candidature &&
      profileParams.mht_candidature !== "type-a" &&
      profileParams.mht_candidature !== "type-b" &&
      profileParams.mht_minority
    ) {
      incompatibleProfileValues.mht_minority = null;
    }
    if (
      profileParams.mht_category &&
      profileParams.mht_category !== "open" &&
      profileParams.ews
    ) {
      incompatibleProfileValues.ews = false;
    }

    if (Object.keys(incompatibleProfileValues).length > 0) {
      incompatibleProfileValues.categories = null;
      incompatibleProfileValues.page = 1;
      void setProfileParams(incompatibleProfileValues);
    }
  }, [profileParams, round, setProfileParams, year]);

  // Computed values
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (scoreValue) count++;
    if (profileReady) count++;
    if (search) count++;
    if (categories.length > 0) count++;
    if (courses.length > 0) count++;
    if (statuses.length > 0) count++;
    if (universities.length > 0) count++;
    return count;
  }, [
    scoreValue,
    profileReady,
    search,
    categories,
    courses,
    statuses,
    universities,
  ]);

  const clampedPage = useMemo(
    () => getClampedPage(page, perPage, totalItems),
    [page, perPage, totalItems],
  );

  useEffect(() => {
    if (!hasFetched || loading || paginationLoading) {
      return;
    }

    if (clampedPage !== page) {
      setPage(clampedPage);
    }
  }, [clampedPage, hasFetched, loading, page, paginationLoading, setPage]);

  // Fetch data when filters change (debounced)
  useEffect(() => {
    const fetchKey = JSON.stringify({
      scoreValue,
      scoreMode,
      candidateProfile,
      search,
      year,
      round,
      categories,
      courses,
      statuses,
      universities,
      page,
      perPage,
      sortBy,
      sortOrder,
    });

    const shouldCountUserAction = pendingUserFetchActionRef.current;

    // Don't refetch if params haven't changed
    if (fetchKey === lastFetchRef.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!candidateProfile || !scoreIsValid) {
      pendingUserFetchActionRef.current = false;
      lastFetchRef.current = "";
      void fetchData({
        percentileInput: "",
        search,
        year,
        round,
        categories,
        courses,
        statuses,
        homeUniversities: universities,
        page: 1,
        perPage,
        sortBy,
        sortOrder,
      });
      return;
    }

    debounceRef.current = setTimeout(() => {
      if (shouldCountUserAction && !guardAnonymousAction()) {
        return;
      }
      pendingUserFetchActionRef.current = false;
      lastFetchRef.current = fetchKey;
      fetchData(
        {
          percentileInput: scoreValue,
          scoreMode,
          scoreValue,
          profile: candidateProfile,
          search,
          year,
          round,
          categories,
          courses,
          statuses,
          homeUniversities: universities,
          page,
          perPage,
          sortBy,
          sortOrder,
        },
        {
          prefetch: isAuthenticated === true,
        },
      );
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    scoreValue,
    scoreIsValid,
    scoreMode,
    candidateProfile,
    search,
    year,
    round,
    categories,
    courses,
    statuses,
    universities,
    page,
    perPage,
    sortBy,
    sortOrder,
    fetchData,
    guardAnonymousAction,
    isAuthenticated,
  ]);

  // Handlers
  const handleClearAll = useCallback(async () => {
    markResultAction();
    clearCache();
    await Promise.all([
      setProfileParams(null),
      setSearch(null),
      setCourses(null),
      setStatuses(null),
      setUniversities(null),
      setSortBy("cutoff_score"),
      setSortOrder("desc"),
    ]);
  }, [
    setProfileParams,
    setSearch,
    setCourses,
    setStatuses,
    setUniversities,
    setSortBy,
    setSortOrder,
    clearCache,
    markResultAction,
  ]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      markResultAction();
      setPage(newPage);
    },
    [markResultAction, setPage],
  );

  const handlePerPageChange = useCallback(
    (newPerPage: number) => {
      markResultAction();
      setPerPage(newPerPage);
      setPage(1);
    },
    [markResultAction, setPerPage, setPage],
  );

  // Memoized handlers for filter sidebar to prevent re-renders
  const handlePercentileChange = useCallback(
    (v: string) => {
      markResultAction();
      void setProfileParams({ percentile: v || null, page: 1 });
    },
    [markResultAction, setProfileParams],
  );
  const handleYearChange = useCallback(
    (v: number) => {
      markResultAction();
      const nextRound = ROUNDS_BY_YEAR[v]?.includes(round) ? round : 1;
      void setProfileParams({ year: v, round: nextRound, page: 1 });
      clearCache();
    },
    [markResultAction, round, setProfileParams, clearCache],
  );
  const handleRoundChange = useCallback(
    (v: number) => {
      markResultAction();
      void setProfileParams({ round: v, page: 1 });
      clearCache();
    },
    [markResultAction, setProfileParams, clearCache],
  );
  const handleCategoriesChange = useCallback(
    (v: string[]) => {
      markResultAction();
      void setProfileParams({
        categories: v.length > 0 ? v : null,
        page: 1,
      });
    },
    [markResultAction, setProfileParams],
  );
  const handleCoursesChange = useCallback(
    (v: string[]) => {
      markResultAction();
      setCourses(v.length > 0 ? v : null);
      setPage(1);
    },
    [markResultAction, setCourses, setPage],
  );
  const handleStatusesChange = useCallback(
    (v: string[]) => {
      markResultAction();
      setStatuses(v.length > 0 ? v : null);
      setPage(1);
    },
    [markResultAction, setStatuses, setPage],
  );
  const handleUniversitiesChange = useCallback(
    (v: string[]) => {
      markResultAction();
      setUniversities(v.length > 0 ? v : null);
      setPage(1);
    },
    [markResultAction, setUniversities, setPage],
  );
  const handleScoreModeChange = useCallback(
    (mode: "percentile" | "rank") => {
      markResultAction();
      void setProfileParams({
        scoreMode: mode,
        percentile: mode === "rank" ? null : profileParams.percentile,
        rank: mode === "percentile" ? null : profileParams.rank,
        page: 1,
      });
    },
    [
      markResultAction,
      profileParams.percentile,
      profileParams.rank,
      setProfileParams,
    ],
  );
  const handleRankChange = useCallback(
    (v: string) => {
      markResultAction();
      void setProfileParams({ rank: v || null, page: 1 });
    },
    [markResultAction, setProfileParams],
  );
  const handleToolbarSearchChange = useCallback(
    (v: string) => {
      markResultAction();
      setSearch(v || null);
      setPage(1);
    },
    [markResultAction, setSearch, setPage],
  );
  const handleCandidateHomeUniversityChange = useCallback(
    (value: MhtCetHomeUniversityId | "type-e") => {
      markResultAction();
      if (value === "type-e") {
        void setProfileParams({
          mht_candidature: "type-e",
          mht_home_university: null,
          mht_pwd: false,
          mht_minority: null,
          categories: null,
          page: 1,
        });
      } else {
        void setProfileParams({
          mht_home_university: value,
          mht_candidature:
            profileParams.mht_candidature === "type-e"
              ? null
              : profileParams.mht_candidature,
          categories: null,
          page: 1,
        });
      }
    },
    [markResultAction, profileParams.mht_candidature, setProfileParams],
  );
  const handleCandidatureChange = useCallback(
    (value: MhtCetCandidatureType) => {
      markResultAction();
      void setProfileParams({
        mht_candidature: value,
        mht_home_university:
          value === "type-e" ? null : profileParams.mht_home_university,
        mht_pwd: value === "type-e" ? false : profileParams.mht_pwd,
        mht_minority:
          value === "type-a" || value === "type-b"
            ? profileParams.mht_minority
            : null,
        categories: null,
        page: 1,
      });
    },
    [
      markResultAction,
      profileParams.mht_home_university,
      profileParams.mht_minority,
      profileParams.mht_pwd,
      setProfileParams,
    ],
  );
  const handleCandidateCategoryChange = useCallback(
    (value: MhtCetCategoryId) => {
      markResultAction();
      void setProfileParams({
        mht_category: value,
        ews: value === "open" ? profileParams.ews : false,
        categories: null,
        page: 1,
      });
    },
    [markResultAction, profileParams.ews, setProfileParams],
  );
  const handleLadiesEligibilityChange = useCallback(
    (value: boolean) => {
      markResultAction();
      void setProfileParams({ mht_ladies: value, page: 1 });
    },
    [markResultAction, setProfileParams],
  );
  const handleEligibilityChange = useCallback(
    (key: "ews" | "mht_tfws" | "mht_pwd" | "mht_orphan", value: boolean) => {
      markResultAction();
      void setProfileParams({ [key]: value, page: 1 });
    },
    [markResultAction, setProfileParams],
  );
  const handleMinorityChange = useCallback(
    (value: MhtCetMinorityCommunityId | "") => {
      markResultAction();
      void setProfileParams({ mht_minority: value || null, page: 1 });
    },
    [markResultAction, setProfileParams],
  );

  const filterSidebarProps = useMemo<FilterSidebarProps>(
    () => ({
      candidatureType: profileParams.mht_candidature ?? "",
      candidateCategory: profileParams.mht_category ?? "",
      ewsEligible: profileParams.ews,
      tfwsEligible: profileParams.mht_tfws,
      pwdEligible: profileParams.mht_pwd,
      orphanEligible: profileParams.mht_orphan,
      minorityCommunity: profileParams.mht_minority ?? "",
      categories,
      courses,
      statuses,
      universities,
      eligibleSeatPoolGroups,
      onEwsEligibleChange: (value: boolean) =>
        handleEligibilityChange("ews", value),
      onTfwsEligibleChange: (value: boolean) =>
        handleEligibilityChange("mht_tfws", value),
      onPwdEligibleChange: (value: boolean) =>
        handleEligibilityChange("mht_pwd", value),
      onOrphanEligibleChange: (value: boolean) =>
        handleEligibilityChange("mht_orphan", value),
      onMinorityCommunityChange: handleMinorityChange,
      onCategoriesChange: handleCategoriesChange,
      onCoursesChange: handleCoursesChange,
      onStatusesChange: handleStatusesChange,
      onUniversitiesChange: handleUniversitiesChange,
      onClearAll: handleClearAll,
      activeFilterCount,
    }),
    [
      profileParams,
      categories,
      courses,
      statuses,
      universities,
      eligibleSeatPoolGroups,
      handleEligibilityChange,
      handleMinorityChange,
      handleCategoriesChange,
      handleCoursesChange,
      handleStatusesChange,
      handleUniversitiesChange,
      handleClearAll,
      activeFilterCount,
    ],
  );

  const handleCloseMobileFilterToast = useCallback(() => {
    setMobileFilterOpen(false);
  }, []);

  useEffect(() => {
    if (!mobileFilterOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileFilterOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileFilterOpen]);

  const handleOpenMobileFilterToast = useCallback(() => {
    setMobileFilterOpen(true);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (
        mobileFilterOpen &&
        shouldAutoDismissMobileFilterToast(window.innerWidth)
      ) {
        handleCloseMobileFilterToast();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileFilterOpen, handleCloseMobileFilterToast]);

  const refinementCount =
    categories.length +
    courses.length +
    statuses.length +
    universities.length +
    [
      profileParams.ews,
      profileParams.mht_tfws,
      profileParams.mht_pwd,
      profileParams.mht_orphan,
      Boolean(profileParams.mht_minority),
    ].filter(Boolean).length;
  const homeUniversity =
    profileParams.mht_candidature === "type-e"
      ? ("type-e" as const)
      : (profileParams.mht_home_university ?? "");
  const scoreInvalid = Boolean(scoreValue) && !scoreIsValid;
  const step = nextQueryStep({
    scoreReady: scoreIsValid,
    homeUniversity,
    candidature: profileParams.mht_candidature ?? "",
    category: profileParams.mht_category ?? "",
    ladies: profileParams.mht_ladies,
  });
  const allowedRounds = ROUNDS_BY_YEAR[year] ?? [1];
  const notes = [
    derivedSeatPools && derivedSeatPools.ignoredRequestedCodes.length > 0
      ? `Ignored unavailable seat pools: ${derivedSeatPools.ignoredRequestedCodes.join(", ")}.`
      : null,
    profileMetadata?.excludedUnmappedRows
      ? `${profileMetadata.excludedUnmappedRows} unmapped rows left out.`
      : null,
  ].filter((note): note is string => Boolean(note));

  return (
    <main className="mht-tool">
      <LoginRequiredDialog
        open={loginGateOpen}
        redirectTo={loginRedirectTo}
        onOpenChange={setLoginGateOpen}
      />

      {mobileFilterOpen ? (
        <div
          className="mht-sheet-backdrop"
          role="presentation"
          onClick={handleCloseMobileFilterToast}
        >
          <div
            className="mht-sheet-frame"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            onClick={(event) => event.stopPropagation()}
          >
            <MobileFilterToast
              {...filterSidebarProps}
              onApply={handleCloseMobileFilterToast}
              onClose={handleCloseMobileFilterToast}
            />
          </div>
        </div>
      ) : null}

      <div className="mht-head">
        <h1 className="mht-h1">State cutoffs</h1>
        <div className="mht-year-round">
          <MhtPill
            label="Year"
            value={String(year)}
            options={YEAR_OPTIONS.map((option) => ({
              value: String(option.value),
              label: option.label,
            }))}
            onChange={(value) => handleYearChange(Number(value))}
          />
          <MhtPill
            label="Round"
            value={String(round)}
            options={allowedRounds.map((value) => ({
              value: String(value),
              label: String(value),
            }))}
            onChange={(value) => handleRoundChange(Number(value))}
          />
        </div>
      </div>

      <aside className="mht-tool-side" aria-label="Filters">
        <FilterSidebar {...filterSidebarProps} />
      </aside>

      <div className="mht-tool-main">
        <QueryBar
          scoreMode={scoreMode}
          score={scoreValue}
          scoreInvalid={scoreInvalid}
          homeUniversity={homeUniversity}
          candidature={profileParams.mht_candidature ?? ""}
          category={profileParams.mht_category ?? ""}
          ladies={profileParams.mht_ladies}
          step={step}
          onScoreModeChange={handleScoreModeChange}
          onScoreChange={
            scoreMode === "rank" ? handleRankChange : handlePercentileChange
          }
          onHomeUniversityChange={handleCandidateHomeUniversityChange}
          onCandidatureChange={handleCandidatureChange}
          onCategoryChange={handleCandidateCategoryChange}
          onLadiesChange={handleLadiesEligibilityChange}
        />

        {notes.length > 0 ? (
          <p className="mht-tool-note">{notes.join(" ")}</p>
        ) : null}

        {step ? null : (
          <TopToolbar
            totalItems={totalItems}
            currentPage={page}
            year={year}
            round={round}
            loading={loading}
            queryReady={profileReady && scoreIsValid}
            search={search}
            onSearchChange={handleToolbarSearchChange}
            sortLabel={
              scoreMode === "rank"
                ? "closest rank first"
                : "closest percentile first"
            }
            visibleColumns={visibleColumns}
            onColumnVisibilityChange={setVisibleColumns}
            records={records}
            filterCount={refinementCount}
            onOpenFilters={handleOpenMobileFilterToast}
          />
        )}

        {step ? (
          <div className="mht-card mht-data-card">
            <p className="mht-data-state mht-data-prompt">
              {queryStepMessage(step, scoreMode, scoreInvalid)}
            </p>
          </div>
        ) : (
          <DataTable
            records={records}
            totalItems={totalItems}
            currentPage={page}
            perPage={perPage}
            loading={loading}
            paginationLoading={paginationLoading}
            error={error}
            search={search}
            searchInsight={searchInsight}
            percentileTarget={scoreMode === "percentile" ? percentile : ""}
            hasActiveQuery={profileReady && scoreIsValid}
            visibleColumns={visibleColumns}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
          />
        )}
      </div>
    </main>
  );
}

export default function StateCutoffsPage() {
  return (
    <Suspense
      fallback={
        <main className="mht-tool" aria-busy="true">
          <div className="mht-tool-main">
            <div className="mht-card mht-data-card mht-skeleton mht-data-placeholder" />
          </div>
        </main>
      }
    >
      <StateCutoffsContent />
    </Suspense>
  );
}
