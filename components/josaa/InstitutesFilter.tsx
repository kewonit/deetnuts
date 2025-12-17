"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter, Loader2 } from "lucide-react";

interface InstitutesFilterProps {
  states: string[];
  currentType?: string;
  currentState?: string;
  currentQuery?: string;
  counts: {
    IIT: number;
    NIT: number;
    IIIT: number;
    GFTI: number;
    CFTI: number;
    all: number;
  };
}

const TYPE_COLORS: Record<string, string> = {
  all: "bg-gray-100 hover:bg-gray-200",
  IIT: "bg-orange-100 hover:bg-orange-200 data-[active=true]:bg-orange-300",
  NIT: "bg-blue-100 hover:bg-blue-200 data-[active=true]:bg-blue-300",
  IIIT: "bg-green-100 hover:bg-green-200 data-[active=true]:bg-green-300",
  GFTI: "bg-purple-100 hover:bg-purple-200 data-[active=true]:bg-purple-300",
  CFTI: "bg-pink-100 hover:bg-pink-200 data-[active=true]:bg-pink-300",
};

export default function InstitutesFilter({
  states,
  currentType,
  currentState,
  currentQuery,
  counts,
}: InstitutesFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentQuery || "");

  // Update URL with new params
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, pathname, router]
  );

  const handleTypeChange = (type: string) => {
    updateParams({ type: type === "all" ? null : type });
  };

  const handleStateChange = (state: string) => {
    updateParams({ state: state === "all" ? null : state });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: searchValue || null });
  };

  const clearFilters = () => {
    setSearchValue("");
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const hasActiveFilters = currentType || currentState || currentQuery;

  return (
    <div className="mb-6 space-y-4">
      {/* Type Pills */}
      <div className="flex flex-wrap gap-2">
        {["all", "IIT", "NIT", "IIIT", "GFTI", "CFTI"]
          .filter((type) => {
            // Always show "all", only show others if count > 0
            if (type === "all") return true;
            return (counts[type as keyof typeof counts] || 0) > 0;
          })
          .map((type) => {
            const isActive =
              (type === "all" && !currentType) || currentType === type;
            const count =
              type === "all" ? counts.all : counts[type as keyof typeof counts];

            return (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                data-active={isActive}
                className={`
                px-4 py-2 rounded-lg border-2 border-black font-semibold transition-all
                ${TYPE_COLORS[type]}
                ${
                  isActive
                    ? "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "shadow-none"
                }
                disabled:opacity-50
              `}
                disabled={isPending}
              >
                {type === "all" ? "All" : type}s
                <Badge className="ml-2 bg-white/70 text-black border-0 text-xs">
                  {count}
                </Badge>
              </button>
            );
          })}
      </div>

      {/* Search and State Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-grow flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search institutes by name, city, or state..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 border-2 border-black"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  updateParams({ q: null });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            className="border-2 border-black bg-blue-500 hover:bg-blue-600"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </form>

        <div className="w-full md:w-64">
          <Select
            value={currentState || "all"}
            onValueChange={handleStateChange}
            disabled={isPending}
          >
            <SelectTrigger className="border-2 border-black">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          {currentType && (
            <Badge
              className={`${TYPE_COLORS[currentType]} text-black border border-black cursor-pointer`}
              onClick={() => handleTypeChange("all")}
            >
              {currentType}s <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {currentState && (
            <Badge
              className="bg-gray-100 text-black border border-black cursor-pointer"
              onClick={() => handleStateChange("all")}
            >
              {currentState} <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {currentQuery && (
            <Badge
              className="bg-blue-100 text-black border border-black cursor-pointer"
              onClick={() => {
                setSearchValue("");
                updateParams({ q: null });
              }}
            >
              "{currentQuery}" <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          <Button
            variant="noShadow"
            size="sm"
            onClick={clearFilters}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={isPending}
          >
            Clear all
          </Button>
          {isPending && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
          )}
        </div>
      )}
    </div>
  );
}
