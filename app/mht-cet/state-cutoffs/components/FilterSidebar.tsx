"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { type ChangeEvent, type ElementType } from "react";
import {
  ChevronDown,
  Filter,
  GraduationCap,
  Building2,
  Users,
  MapPin,
  Percent,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  CATEGORY_GROUPS,
  COURSE_GROUPS,
  STATUS_OPTIONS,
  HOME_UNIVERSITY_OPTIONS,
  YEAR_OPTIONS,
  ROUND_OPTIONS,
  ROUNDS_BY_YEAR,
} from "../constants";

interface FilterSidebarProps {
  percentile: string;
  search: string;
  year: number;
  round: number;
  categories: string[];
  courses: string[];
  statuses: string[];
  universities: string[];
  scoreMode: "percentile" | "rank";
  rank: string;
  onPercentileChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onYearChange: (value: number) => void;
  onRoundChange: (value: number) => void;
  onCategoriesChange: (value: string[]) => void;
  onCoursesChange: (value: string[]) => void;
  onStatusesChange: (value: string[]) => void;
  onUniversitiesChange: (value: string[]) => void;
  onScoreModeChange: (value: "percentile" | "rank") => void;
  onRankChange: (value: string) => void;
  onClearAll: () => void;
  activeFilterCount: number;
  className?: string;
}

const YearRoundSelector = memo(function YearRoundSelector({
  year,
  round,
  onYearChange,
  onRoundChange,
}: {
  year: number;
  round: number;
  onYearChange: (v: number) => void;
  onRoundChange: (v: number) => void;
}) {
  const allowedRounds = ROUNDS_BY_YEAR[year] ?? [1];
  const isRound2025 = year === 2025;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          Year
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {YEAR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onYearChange(opt.value)}
              className={cn(
                "relative h-10 rounded-lg font-semibold text-sm transition-all duration-150",
                "border hover:scale-[1.01] active:scale-[0.99]",
                year === opt.value
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50",
              )}
            >
              {opt.label}
              {year === opt.value && (
                <Check className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <Layers className="h-3.5 w-3.5" />
          Round
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {ROUND_OPTIONS.map((opt) => {
            const isDisabled = !allowedRounds.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => !isDisabled && onRoundChange(opt.value)}
                disabled={isDisabled}
                className={cn(
                  "relative h-9 rounded-lg font-semibold text-sm transition-all duration-150",
                  "border",
                  isDisabled
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : round === opt.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:scale-[1.01] active:scale-[0.99]",
                )}
              >
                R{opt.value}
                {round === opt.value && !isDisabled && (
                  <Check className="absolute right-1 top-1/2 -translate-y-1/2 h-3.5 w-3.5" />
                )}
              </button>
            );
          })}
        </div>
        {year === 2024 && (
          <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
            Rounds 1–3 available for 2024
          </p>
        )}
        {year === 2025 && (
          <p className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
            Rounds 1–4 available for 2025
          </p>
        )}
      </div>
    </div>
  );
});

const PercentileInput = memo(function PercentileInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const numValue = parseFloat(value) || 0;

  const handleSliderChange = useCallback(
    (vals: number[]) => {
      onChange(vals[0].toFixed(2));
    },
    [onChange],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === "") {
        onChange("");
        return;
      }
      const regex = /^(100(\.0{0,10})?|[0-9]{1,2}(\.\d{0,10})?|\.)$/;
      if (regex.test(val)) {
        const numVal = parseFloat(val);
        if (isNaN(numVal) || (numVal >= 0 && numVal <= 100)) {
          onChange(val);
        }
      }
    },
    [onChange],
  );

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
        <Percent className="h-3.5 w-3.5" />
        Your Percentile
      </Label>
      <div className="relative">
        <Input
          type="text"
          placeholder="Enter percentile (e.g., 95.5)"
          value={value}
          onChange={handleInputChange}
          className={cn(
            "h-11 text-base font-semibold text-center pr-8",
            "border border-gray-300 focus:border-purple-500 rounded-lg",
            "transition-all duration-150",
            value ? "bg-purple-50 border-purple-300" : "bg-white",
          )}
          maxLength={14}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
          %
        </span>
      </div>
      <Slider
        value={[numValue]}
        onValueChange={handleSliderChange}
        max={100}
        min={0}
        step={0.1}
        className="py-1"
      />
      {value && (
        <div className="text-xs text-gray-600 bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
          Showing cutoffs from <span className="font-semibold">0%</span> to{" "}
          <span className="font-semibold">{value}%</span>
        </div>
      )}
    </div>
  );
});

const RankInput = memo(function RankInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === "") {
        onChange("");
        return;
      }
      const regex = /^\d{0,7}$/;
      if (regex.test(val)) {
        onChange(val);
      }
    },
    [onChange],
  );

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
        <Layers className="h-3.5 w-3.5" />
        Your Rank
      </Label>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="Enter AIR (e.g., 1234)"
        value={value}
        onChange={handleInputChange}
        className="h-11 text-base font-semibold text-center border border-gray-300 focus:border-blue-500 rounded-lg"
        maxLength={7}
      />
      {value && (
        <p className="text-xs text-gray-600 bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
          Filtering results using an approximate percentile conversion.
        </p>
      )}
    </div>
  );
});

const ScoreModeTabs = memo(function ScoreModeTabs({
  mode,
  onChange,
}: {
  mode: "percentile" | "rank";
  onChange: (mode: "percentile" | "rank") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
      {[
        { value: "percentile" as const, label: "Percentile" },
        { value: "rank" as const, label: "Rank" },
      ].map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "h-9 rounded-md text-sm font-semibold transition-all",
            mode === opt.value
              ? "bg-white shadow-sm border border-gray-300 text-gray-900"
              : "text-gray-600 hover:text-gray-800",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
});

const FilterGroup = memo(function FilterGroup({
  title,
  icon: Icon,
  groups,
  selected,
  onChange,
  isGrouped = true,
}: {
  title: string;
  icon: ElementType;
  groups: Record<string, string[]> | Array<{ value: string; label: string }>;
  selected: string[];
  onChange: (values: string[]) => void;
  isGrouped?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const toggleItem = useCallback(
    (item: string) => {
      if (selected.includes(item)) {
        onChange(selected.filter((i) => i !== item));
      } else {
        onChange([...selected, item]);
      }
    },
    [selected, onChange],
  );

  const toggleGroup = useCallback(
    (groupItems: string[]) => {
      const allSelected = groupItems.every((item) => selected.includes(item));
      if (allSelected) {
        onChange(selected.filter((item) => !groupItems.includes(item)));
      } else {
        const newSelected = [...selected];
        groupItems.forEach((item) => {
          if (!newSelected.includes(item)) {
            newSelected.push(item);
          }
        });
        onChange(newSelected);
      }
    },
    [selected, onChange],
  );

  const clearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groups;
    const term = searchTerm.toLowerCase();

    if (Array.isArray(groups)) {
      return groups.filter(
        (item) =>
          item.label.toLowerCase().includes(term) ||
          item.value.toLowerCase().includes(term),
      );
    }

    const filtered: Record<string, string[]> = {};
    Object.entries(groups).forEach(([groupName, items]) => {
      const matchedItems = items.filter((item) =>
        item.toLowerCase().includes(term),
      );
      if (matchedItems.length > 0 || groupName.toLowerCase().includes(term)) {
        filtered[groupName] = groupName.toLowerCase().includes(term)
          ? items
          : matchedItems;
      }
    });
    return filtered;
  }, [groups, searchTerm]);

  return (
    <AccordionItem
      value={title}
      className="border border-gray-200 rounded-lg overflow-hidden bg-white"
    >
      <AccordionTrigger className="py-3 px-3 hover:no-underline hover:bg-gray-50 transition-colors group data-[state=open]:bg-gray-50">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={cn(
              "p-2 rounded-lg transition-colors",
              selected.length > 0
                ? "bg-purple-600"
                : "bg-gray-100 group-hover:bg-gray-200",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                selected.length > 0 ? "text-white" : "text-gray-600",
              )}
            />
          </div>
          <span className="font-medium text-sm text-gray-800 break-words whitespace-normal">
            {title}
          </span>
          {selected.length > 0 && (
            <Badge className="ml-auto mr-2 bg-purple-600 text-white hover:bg-purple-700 px-2 py-0.5 text-xs">
              {selected.length}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-3 pt-1">
        <div className="space-y-3">
          <div className="flex gap-3">
            <Input
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 text-sm border-gray-300 focus:border-purple-500"
            />
            {selected.length > 0 && (
              <Button
                variant="neutral"
                size="sm"
                onClick={clearAll}
                className="h-10 px-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 whitespace-nowrap"
              >
                Clear
              </Button>
            )}
          </div>

          <ScrollArea className="h-[220px]">
            <div className="space-y-1 pr-3">
              {isGrouped && !Array.isArray(filteredGroups)
                ? Object.entries(filteredGroups).map(([groupName, items]) => (
                    <Collapsible
                      key={groupName}
                      defaultOpen={selected.some((s) => items.includes(s))}
                    >
                      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors min-w-0">
                        <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        <span className="text-sm font-medium text-gray-700 flex-1 text-left break-words whitespace-normal min-w-0">
                          {groupName}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {items.length}
                        </span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-5 pt-2 space-y-1">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleGroup(items)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && toggleGroup(items)
                          }
                          className="flex items-center gap-3 w-full py-2 px-3 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Checkbox
                            checked={items.every((item) =>
                              selected.includes(item),
                            )}
                            className="h-4 w-4 data-[state=checked]:bg-purple-600 pointer-events-none"
                          />
                          <span className="font-medium">Select All</span>
                        </div>
                        {items.map((item) => (
                          <div
                            key={item}
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleItem(item)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && toggleItem(item)
                            }
                            className={cn(
                              "flex items-center gap-3 w-full py-2 px-3 text-sm rounded-lg transition-colors cursor-pointer min-w-0",
                              selected.includes(item)
                                ? "bg-purple-100 text-purple-700"
                                : "hover:bg-gray-50 text-gray-600",
                            )}
                          >
                            <Checkbox
                              checked={selected.includes(item)}
                              className="h-4 w-4 pointer-events-none"
                            />
                            <span className="truncate break-words whitespace-normal">
                              {item}
                            </span>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                : (Array.isArray(filteredGroups) ? filteredGroups : []).map(
                    (item) => (
                      <div
                        key={typeof item === "string" ? item : item.value}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          toggleItem(
                            typeof item === "string" ? item : item.value,
                          )
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          toggleItem(
                            typeof item === "string" ? item : item.value,
                          )
                        }
                        className={cn(
                          "flex items-center gap-3 w-full py-2.5 px-3 text-sm rounded-lg transition-colors cursor-pointer min-w-0",
                          selected.includes(
                            typeof item === "string" ? item : item.value,
                          )
                            ? "bg-purple-100 text-purple-700"
                            : "hover:bg-gray-50 text-gray-600",
                        )}
                      >
                        <Checkbox
                          checked={selected.includes(
                            typeof item === "string" ? item : item.value,
                          )}
                          className="h-4 w-4 pointer-events-none"
                        />
                        <span className="truncate break-words whitespace-normal">
                          {typeof item === "string" ? item : item.label}
                        </span>
                      </div>
                    ),
                  )}
            </div>
          </ScrollArea>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
});

export const FilterSidebar = memo(function FilterSidebar({
  percentile,
  search,
  year,
  round,
  categories,
  courses,
  statuses,
  universities,
  scoreMode,
  rank,
  onPercentileChange,
  onSearchChange,
  onYearChange,
  onRoundChange,
  onCategoriesChange,
  onCoursesChange,
  onStatusesChange,
  onUniversitiesChange,
  onScoreModeChange,
  onRankChange,
  onClearAll,
  activeFilterCount,
  className,
}: FilterSidebarProps) {
  return (
    <div
      className={cn("flex flex-col h-full overflow-hidden bg-white", className)}
    >
      <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900">Filters</h2>
              <p className="text-xs text-gray-500">Refine your search</p>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="neutral"
              size="sm"
              onClick={onClearAll}
              className="h-8 px-3 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 gap-1.5 rounded-md"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}
        </div>
        {activeFilterCount > 0 && (
          <div className="mt-3">
            <Badge
              variant="neutral"
              className="bg-purple-100 text-purple-700 border-purple-200 px-2 py-1 text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {activeFilterCount} active
            </Badge>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="px-5 py-5 space-y-6">
          <YearRoundSelector
            year={year}
            round={round}
            onYearChange={onYearChange}
            onRoundChange={onRoundChange}
          />

          <Separator className="bg-gray-200" />

          <div className="space-y-4">
            <ScoreModeTabs mode={scoreMode} onChange={onScoreModeChange} />
            {scoreMode === "percentile" ? (
              <PercentileInput
                value={percentile}
                onChange={onPercentileChange}
              />
            ) : (
              <RankInput value={rank} onChange={onRankChange} />
            )}
          </div>

          <Separator className="bg-gray-200" />

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Advanced Filters
            </h3>
            <Accordion
              type="multiple"
              className="space-y-2"
              defaultValue={["Categories", "Courses"]}
            >
              <FilterGroup
                title="Categories"
                icon={Users}
                groups={CATEGORY_GROUPS}
                selected={categories}
                onChange={onCategoriesChange}
                isGrouped
              />

              <FilterGroup
                title="Courses"
                icon={GraduationCap}
                groups={COURSE_GROUPS}
                selected={courses}
                onChange={onCoursesChange}
                isGrouped
              />

              <FilterGroup
                title="College Status"
                icon={Building2}
                groups={STATUS_OPTIONS}
                selected={statuses}
                onChange={onStatusesChange}
                isGrouped={false}
              />

              <FilterGroup
                title="University"
                icon={MapPin}
                groups={HOME_UNIVERSITY_OPTIONS}
                selected={universities}
                onChange={onUniversitiesChange}
                isGrouped={false}
              />
            </Accordion>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
});
