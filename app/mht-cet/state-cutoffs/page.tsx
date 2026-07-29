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
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import {
  FilterSidebar,
  type FilterSidebarProps,
} from "./components/FilterSidebar";
import { LoginRequiredDialog } from "./components/LoginRequiredDialog";
import { MobileFilterToast } from "./components/MobileFilterToast";
import { TopToolbar } from "./components/TopToolbar";
import { useCutoffData } from "./hooks/use-cutoff-data";
import { recordAnonymousStateCutoffAction } from "./anonymous-usage";
import { ROUNDS_BY_YEAR } from "./constants";
import {
  MHT_CET_CANDIDATURE_OPTIONS,
  MHT_CET_CATEGORY_OPTIONS,
  MHT_CET_HOME_UNIVERSITIES,
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

// Dynamic import for heavy DataTable component - reduces initial bundle
const DataTable = dynamic(
  () => import("./components/DataTable").then((mod) => mod.DataTable),
  {
    loading: () => (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
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
      year: parseAsInteger.withDefault(2025),
      round: parseAsInteger.withDefault(1),
      mht_candidature: parseAsStringLiteral(
        MHT_CET_CANDIDATURE_IDS,
      ),
      mht_home_university: parseAsStringLiteral(
        MHT_CET_HOME_UNIVERSITY_IDS,
      ),
      mht_category: parseAsStringLiteral(
        MHT_CET_CATEGORY_IDS,
      ),
      mht_ladies: parseAsBoolean,
      ews: parseAsBoolean.withDefault(false),
      mht_tfws: parseAsBoolean.withDefault(false),
      mht_pwd: parseAsBoolean.withDefault(false),
      mht_orphan: parseAsBoolean.withDefault(false),
      mht_minority: parseAsStringLiteral(
        MHT_CET_MINORITY_IDS,
      ),
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
  const [density, setDensity] = useQueryState(
    "density",
    parseAsStringLiteral([
      "compact",
      "comfortable",
      "spacious",
    ] as const).withDefault("comfortable"),
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
    let isActive = true;
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (isActive) {
          setIsAuthenticated(Boolean(data.user));
        }
      })
      .catch(() => {
        if (isActive) {
          setIsAuthenticated(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isActive) {
        setIsAuthenticated(Boolean(session?.user));
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
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
            : profileParams.mht_home_university ?? undefined,
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
      incompatibleProfileValues.year = 2025;
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

  const handleSortChange = useCallback(
    (newSortBy: string, newSortOrder: "asc" | "desc") => {
      markResultAction();
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
    },
    [markResultAction, setSortBy, setSortOrder],
  );

  const handleRemoveFilter = useCallback(
    (
      type: "categories" | "courses" | "statuses" | "universities",
      value: string,
    ) => {
      markResultAction();
      switch (type) {
        case "categories":
          void setProfileParams({
            categories: categories.filter((c) => c !== value),
            page: 1,
          });
          break;
        case "courses":
          setCourses(courses.filter((c) => c !== value));
          break;
        case "statuses":
          setStatuses(statuses.filter((s) => s !== value));
          break;
        case "universities":
          setUniversities(universities.filter((u) => u !== value));
          break;
      }
      if (type !== "categories") {
        setPage(1);
      }
    },
    [
      categories,
      courses,
      statuses,
      universities,
      setCourses,
      setStatuses,
      setUniversities,
      setProfileParams,
      setPage,
      markResultAction,
    ],
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
  const handleDensityChange = useCallback(
    (v: "compact" | "comfortable" | "spacious") => setDensity(v),
    [setDensity],
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
    [
      markResultAction,
      profileParams.mht_candidature,
      setProfileParams,
    ],
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
    (
      key: "ews" | "mht_tfws" | "mht_pwd" | "mht_orphan",
      value: boolean,
    ) => {
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

  // Filter sidebar props - memoized
  const filterSidebarProps = useMemo<FilterSidebarProps>(
    () => ({
      percentile,
      year,
      round,
      categories,
      courses,
      statuses,
      universities,
      scoreMode,
      rank,
      candidateHomeUniversity:
        profileParams.mht_candidature === "type-e"
          ? ("type-e" as const)
          : profileParams.mht_home_university ?? "",
      candidatureType: profileParams.mht_candidature ?? "",
      candidateCategory: profileParams.mht_category ?? "",
      ladiesSeatEligible: profileParams.mht_ladies,
      ewsEligible: profileParams.ews,
      tfwsEligible: profileParams.mht_tfws,
      pwdEligible: profileParams.mht_pwd,
      orphanEligible: profileParams.mht_orphan,
      minorityCommunity: profileParams.mht_minority ?? "",
      eligibleSeatPoolGroups,
      onPercentileChange: handlePercentileChange,
      onYearChange: handleYearChange,
      onRoundChange: handleRoundChange,
      onCategoriesChange: handleCategoriesChange,
      onCoursesChange: handleCoursesChange,
      onStatusesChange: handleStatusesChange,
      onUniversitiesChange: handleUniversitiesChange,
      onScoreModeChange: handleScoreModeChange,
      onRankChange: handleRankChange,
      onCandidateHomeUniversityChange:
        handleCandidateHomeUniversityChange,
      onCandidatureChange: handleCandidatureChange,
      onCandidateCategoryChange: handleCandidateCategoryChange,
      onLadiesSeatEligibleChange: handleLadiesEligibilityChange,
      onEwsEligibleChange: (value: boolean) =>
        handleEligibilityChange("ews", value),
      onTfwsEligibleChange: (value: boolean) =>
        handleEligibilityChange("mht_tfws", value),
      onPwdEligibleChange: (value: boolean) =>
        handleEligibilityChange("mht_pwd", value),
      onOrphanEligibleChange: (value: boolean) =>
        handleEligibilityChange("mht_orphan", value),
      onMinorityCommunityChange: handleMinorityChange,
      onClearAll: handleClearAll,
      activeFilterCount,
    }),
    [
      percentile,
      scoreMode,
      rank,
      year,
      round,
      categories,
      courses,
      statuses,
      universities,
      profileParams,
      eligibleSeatPoolGroups,
      handlePercentileChange,
      handleYearChange,
      handleRoundChange,
      handleCategoriesChange,
      handleCoursesChange,
      handleStatusesChange,
      handleUniversitiesChange,
      handleScoreModeChange,
      handleRankChange,
      handleCandidateHomeUniversityChange,
      handleCandidatureChange,
      handleCandidateCategoryChange,
      handleLadiesEligibilityChange,
      handleEligibilityChange,
      handleMinorityChange,
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

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileFilterOpen]);

  const mobileFilterToastContent = useMemo(
    () => (
      <MobileFilterToast
        {...filterSidebarProps}
        onApply={handleCloseMobileFilterToast}
        onClose={handleCloseMobileFilterToast}
      />
    ),
    [filterSidebarProps, handleCloseMobileFilterToast],
  );

  const handleOpenMobileFilterToast = useCallback(() => {
    setMobileFilterOpen(true);
  }, []);

  const handleToggleMobileFilters = useCallback(() => {
    if (mobileFilterOpen) {
      handleCloseMobileFilterToast();
      return;
    }

    handleOpenMobileFilterToast();
  }, [
    mobileFilterOpen,
    handleCloseMobileFilterToast,
    handleOpenMobileFilterToast,
  ]);

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

  // Active filters for toolbar - memoized
  const activeFilters = useMemo(
    () => ({
      categories,
      courses,
      statuses,
      universities,
    }),
    [categories, courses, statuses, universities],
  );
  const candidateProfileLabel = useMemo(() => {
    if (!candidateProfile) return undefined;
    const category = MHT_CET_CATEGORY_OPTIONS.find(
      ({ value }) => value === candidateProfile.categoryId,
    )?.label;
    const candidature = MHT_CET_CANDIDATURE_OPTIONS.find(
      ({ value }) => value === candidateProfile.candidatureType,
    )?.label;
    const homeUniversity = candidateProfile.homeUniversityId
      ? MHT_CET_HOME_UNIVERSITIES.find(
          ({ id }) => id === candidateProfile.homeUniversityId,
        )?.label
      : "No HU";
    return `${candidature} · ${category} · ${homeUniversity}${
      candidateProfile.ladiesSeatEligible ? " · Ladies eligible" : ""
    }`;
  }, [candidateProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4DFF2] via-[#daf5f0] to-[#E4DFF2]">
      <LoginRequiredDialog
        open={loginGateOpen}
        redirectTo={loginRedirectTo}
        onOpenChange={setLoginGateOpen}
      />

      {mobileFilterOpen ? (
        <div
          className="lg:hidden fixed inset-0 z-[120] bg-black/30"
          role="presentation"
          onClick={handleCloseMobileFilterToast}
        >
          <div
            className="absolute inset-x-0 bottom-0 flex max-h-[calc(100dvh-0.75rem)] justify-center px-3 pb-3"
            role="dialog"
            aria-modal="true"
            aria-label="State cutoff filters"
            onClick={(event) => event.stopPropagation()}
          >
            {mobileFilterToastContent}
          </div>
        </div>
      ) : null}

      {/* Mobile Filter Toggle - Fixed at bottom */}
      <div
        className={cn(
          "lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-200",
          mobileFilterOpen && "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <Button
          aria-expanded={mobileFilterOpen}
          aria-pressed={mobileFilterOpen}
          className={cn(
            "h-14 px-6 rounded-full font-bold text-base",
            mobileFilterOpen
              ? "bg-black text-white hover:bg-black/90"
              : "bg-purple-600 text-white hover:bg-purple-700",
            "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
            "border-2 border-black",
            "flex items-center gap-2",
          )}
          onClick={handleToggleMobileFilters}
        >
          {mobileFilterOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          {mobileFilterOpen ? "Close filters" : "Filters"}
          {activeFilterCount > 0 && (
            <Badge className="bg-white text-purple-700 border-0 ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Main Layout */}
      <div className="flex min-h-screen">
        {/* Desktop Sidebar - Sticky with perfect viewport fit */}
        <aside className="hidden lg:block w-[380px] flex-shrink-0">
          <div className="sticky top-0 left-0 w-[380px] h-screen bg-white border-r-2 border-gray-200 shadow-lg overflow-hidden">
            <FilterSidebar {...filterSidebarProps} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-4 lg:px-8 pb-24 lg:pb-8 overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto space-y-5 py-5">
            {derivedSeatPools?.ignoredRequestedCodes.length ||
            profileMetadata?.excludedUnmappedRows ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {derivedSeatPools &&
                derivedSeatPools.ignoredRequestedCodes.length > 0 ? (
                  <span className="block font-medium">
                    Ignored unavailable refinements:{" "}
                    {derivedSeatPools.ignoredRequestedCodes.join(", ")}.
                  </span>
                ) : null}
                {profileMetadata?.excludedUnmappedRows ? (
                  <span className="block font-medium">
                    {profileMetadata.excludedUnmappedRows} unmapped historical
                    rows were excluded.
                  </span>
                ) : null}
              </div>
            ) : null}

            {/* Toolbar */}
            <TopToolbar
              totalItems={totalItems}
              currentPage={page}
              perPage={perPage}
              year={year}
              round={round}
              loading={loading}
              queryReady={profileReady && scoreIsValid}
              onYearChange={handleYearChange}
              onRoundChange={handleRoundChange}
              search={search}
              onSearchChange={handleToolbarSearchChange}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              density={density}
              onDensityChange={handleDensityChange}
              visibleColumns={visibleColumns}
              onColumnVisibilityChange={setVisibleColumns}
              activeFilters={activeFilters}
              profileLabel={candidateProfileLabel}
              fixedSortLabel={
                scoreMode === "rank"
                  ? "Closest closing rank first"
                  : "Closest percentile first"
              }
              onRemoveFilter={handleRemoveFilter}
              records={records}
            />

            {/* Data Table */}
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
              percentileTarget={
                scoreMode === "percentile" ? percentile : ""
              }
              hasActiveQuery={profileReady && scoreIsValid}
              density={density}
              visibleColumns={visibleColumns}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
              onSortChange={handleSortChange}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

// Main Page Export with Suspense boundary
export default function StateCutoffsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#E4DFF2] via-[#daf5f0] to-[#E4DFF2] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Loading cutoff data...</p>
          </div>
        </div>
      }
    >
      <StateCutoffsContent />
    </Suspense>
  );
}
