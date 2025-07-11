'use client';

import { Filter, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORY_GROUPS, COURSE_GROUPS, STATUS_OPTIONS, HOME_UNIVERSITY_OPTIONS, ROUND_OPTIONS } from '../constants';
import { getPrecisePercentileRange } from '../utils';
import { FilterState, PendingFilters } from '../types';
import { Dispatch, SetStateAction, useCallback } from 'react';

interface CutoffFiltersProps {
    filters: FilterState;
    pendingFilters: PendingFilters;
    setPendingFilters: Dispatch<SetStateAction<PendingFilters>>;
    hasUnsavedChanges: boolean;
    isSearching: boolean;
    loading: boolean;
    applyFilters: () => void;
    clearAllFilters: () => void;
}

export function CutoffFilters({
    filters,
    pendingFilters,
    setPendingFilters,
    hasUnsavedChanges,
    isSearching,
    loading,
    applyFilters,
    clearAllFilters,
}: CutoffFiltersProps) {

    const handleCategoryToggle = useCallback((category: string) => {
        setPendingFilters(prev => ({
            ...prev,
            categories: prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category]
        }));
    }, [setPendingFilters]);

    const handleCourseToggle = useCallback((course: string) => {
        setPendingFilters(prev => ({
            ...prev,
            courses: prev.courses.includes(course)
                ? prev.courses.filter(c => c !== course)
                : [...prev.courses, course]
        }));
    }, [setPendingFilters]);

    const handleStatusToggle = useCallback((status: string) => {
        setPendingFilters(prev => ({
            ...prev,
            statuses: prev.statuses.includes(status)
                ? prev.statuses.filter(s => s !== status)
                : [...prev.statuses, status]
        }));
    }, [setPendingFilters]);

    const handleHomeUniversityToggle = useCallback((homeUniversity: string) => {
        setPendingFilters(prev => ({
            ...prev,
            homeUniversities: prev.homeUniversities.includes(homeUniversity)
                ? prev.homeUniversities.filter(h => h !== homeUniversity)
                : [...prev.homeUniversities, homeUniversity]
        }));
    }, [setPendingFilters]);

    const handleRoundChange = useCallback((roundValue: string) => {
        const round = parseInt(roundValue, 10);
        if (Number.isInteger(round) && round >= 1 && round <= 3) {
            setPendingFilters(prev => ({ ...prev, round }));
        }
    }, [setPendingFilters]);

    return (
        <Card className="shadow-lg border border-gray-200 overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-200">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                            <Filter className="h-5 w-5 text-gray-700" />
                        </div>
                        <div>
                            <h3 className="font-abel text-xl font-bold text-gray-900">Search Filters</h3>
                            <p className="text-sm text-gray-600 font-abel mt-1">Customize your search parameters</p>
                        </div>
                    </div>
                    {hasUnsavedChanges && (
                        <Badge variant="neutral" className="font-abel bg-amber-100 text-amber-800 border-amber-300 text-sm px-3 py-1 animate-pulse">
                            Changes Pending
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search colleges or universities"
                        value={pendingFilters.search}
                        onChange={(e) => {
                            const value = e.target.value;
                            // Basic sanitization - remove any non-printable characters and limit length
                            const sanitized = value.replace(/[^\x20-\x7E]/g, '').slice(0, 100);
                            setPendingFilters(prev => ({ ...prev, search: sanitized }));
                        }}
                        className="pl-10 font-abel text-sm md:text-base h-12"
                        maxLength={100}
                    />
                </div>

                {/* Enhanced Counseling Round Selection - Fully Responsive */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 md:p-5 space-y-3 md:space-y-4">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <Label className="text-base md:text-lg font-bold font-abel text-blue-900">
                            Counseling Round
                        </Label>
                    </div>
                    <p className="text-xs md:text-sm text-blue-700 font-abel leading-relaxed">
                        Select which round of MHT-CET counseling data to view. Each round has different cutoff scores.
                    </p>
                    <Select
                        value={pendingFilters.round.toString()}
                        onValueChange={handleRoundChange}
                    >
                        <SelectTrigger className="font-abel text-sm md:text-base h-12 md:h-14 bg-white border-2 border-blue-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm">
                            <SelectValue placeholder="Choose a counseling round" />
                        </SelectTrigger>
                        <SelectContent className="border-blue-200 w-[calc(100vw-2rem)] sm:w-[380px] md:min-w-[400px] max-w-[500px]">
                            {ROUND_OPTIONS.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value.toString()}
                                    className="font-abel hover:bg-blue-50 focus:bg-blue-50 py-3 md:py-4 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 md:gap-4 w-full">
                                        <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-300">
                                            <span className="text-sm md:text-base font-bold text-blue-700">{option.value}</span>
                                        </div>
                                        <div className="flex flex-col flex-1 text-left min-w-0">
                                            <span className="font-bold text-blue-900 text-sm md:text-base mb-0.5 md:mb-1 truncate">
                                                {option.label}
                                            </span>
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {/* Percentile Input */}
                    <div className="space-y-2">
                        <Label className="text-sm md:text-base font-medium flex items-center gap-2 font-abel">
                            Target Percentile (from 0% to target)
                        </Label>
                        <div className="relative">
                            <Input
                                placeholder="Enter percentile (e.g., 95.1234567)"
                                value={pendingFilters.percentileInput}
                                onChange={(e) => {
                                    const value = e.target.value;

                                    // Allow empty string
                                    if (value === '') {
                                        setPendingFilters(prev => ({ ...prev, percentileInput: value }));
                                        return;
                                    }

                                    // More flexible regex for decimal input
                                    // Allows: 0-100, with optional decimal point and up to 7 decimal places
                                    const percentileRegex = /^(100(\.0{1,7})?|[0-9]{1,2}(\.\d{0,7})?)$/;

                                    // First check if it matches the pattern or is a partial valid input
                                    const partialRegex = /^(100(\.0{0,7})?|[0-9]{1,2}(\.\d{0,7})?|\.)$/;

                                    if (partialRegex.test(value)) {
                                        // If it's a complete valid number, check range
                                        if (percentileRegex.test(value)) {
                                            const numValue = parseFloat(value);
                                            if (numValue >= 0 && numValue <= 100) {
                                                setPendingFilters(prev => ({ ...prev, percentileInput: value }));
                                            }
                                        } else {
                                            // Allow partial input (like "95." while typing)
                                            setPendingFilters(prev => ({ ...prev, percentileInput: value }));
                                        }
                                    }
                                }}
                                type="text"
                                className="font-abel text-sm md:text-base h-12 pr-12"
                                maxLength={11}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground font-abel">
                                %
                            </div>
                        </div>
                        {pendingFilters.percentileInput && (
                            <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                <p className="text-xs sm:text-sm text-blue-700 font-abel">
                                    {(() => {
                                        const target = parseFloat(pendingFilters.percentileInput);
                                        if (isNaN(target)) return "Please enter a valid percentile number";
                                        const range = getPrecisePercentileRange(target);
                                        return `Will show percentiles from ${range.min}% to ${range.max}% (all options at or below your target)`;
                                    })()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {/* Enhanced Category Filter */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="neutral" className="justify-between h-12 font-abel text-sm md:text-base hover:bg-blue-50 border-2 hover:border-blue-300 transition-all duration-200">
                                <span className="truncate mr-2">Categories</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {pendingFilters.categories.length > 0 && (
                                        <Badge variant="default" className="ml-2 text-xs px-2 py-0 font-abel bg-blue-600 text-white">
                                            {pendingFilters.categories.length}
                                        </Badge>
                                    )}
                                    <Filter className="h-4 w-4" />
                                </div>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-96 md:w-[450px] p-0 max-h-[85vh] overflow-hidden shadow-xl border-2">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-semibold font-abel text-base md:text-lg text-blue-900">Select Categories</h4>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => {
                                            setPendingFilters(prev => ({ ...prev, categories: [] }));
                                        }}
                                        className="font-abel text-xs md:text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                                    >
                                        Clear All
                                    </Button>
                                </div>
                            </div>
                            <ScrollArea className="h-96 bg-white">
                                <div className="px-4 pb-4 pt-2 space-y-5">
                                    {Object.entries(CATEGORY_GROUPS).map(([group, categories]) => (
                                        <div key={group} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <Label className="text-sm font-semibold text-gray-800 font-abel">{group}</Label>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="h-auto p-1 text-xs font-abel text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                                                    onClick={() => {
                                                        const allSelected = categories.every(cat => pendingFilters.categories.includes(cat));
                                                        if (allSelected) {
                                                            setPendingFilters(prev => ({
                                                                ...prev,
                                                                categories: prev.categories.filter(c => !categories.includes(c))
                                                            }));
                                                        } else {
                                                            setPendingFilters(prev => ({
                                                                ...prev,
                                                                categories: [...new Set([...prev.categories, ...categories])]
                                                            }));
                                                        }
                                                    }}
                                                >
                                                    {categories.every(cat => pendingFilters.categories.includes(cat)) ? 'Deselect All' : 'Select All'}
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {categories.map((category) => (
                                                    <div key={category} className="flex items-center space-x-2 p-1 hover:bg-white rounded transition-colors">
                                                        <Checkbox
                                                            id={category}
                                                            checked={pendingFilters.categories.includes(category)}
                                                            onCheckedChange={() => handleCategoryToggle(category)}
                                                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                        />
                                                        <Label htmlFor={category} className="text-xs font-abel cursor-pointer leading-tight text-gray-700 hover:text-gray-900">
                                                            {category}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>

                    {/* Enhanced Course Filter */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="neutral" className="justify-between h-12 font-abel text-sm md:text-base hover:bg-green-50 border-2 hover:border-green-300 transition-all duration-200">
                                <span className="truncate mr-2">Courses</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {pendingFilters.courses.length > 0 && (
                                        <Badge variant="default" className="ml-2 text-xs px-2 py-0 font-abel bg-green-600 text-white">
                                            {pendingFilters.courses.length}
                                        </Badge>
                                    )}
                                    <Filter className="h-4 w-4" />
                                </div>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-96 md:w-[500px] p-0 max-h-[85vh] overflow-hidden shadow-xl border-2">
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-semibold font-abel text-base md:text-lg text-green-900">Select Courses</h4>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => {
                                            setPendingFilters(prev => ({ ...prev, courses: [] }));
                                        }}
                                        className="font-abel text-xs md:text-sm text-green-700 hover:text-green-900 hover:bg-green-100"
                                    >
                                        Clear All
                                    </Button>
                                </div>
                            </div>
                            <ScrollArea className="h-96 bg-white">
                                <div className="px-4 pb-4 pt-2 space-y-5">
                                    {Object.entries(COURSE_GROUPS).map(([group, courses]) => (
                                        <div key={group} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <Label className="text-sm font-semibold text-gray-800 font-abel">{group}</Label>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="h-auto p-1 text-xs font-abel text-green-600 hover:text-green-800 hover:bg-green-100"
                                                    onClick={() => {
                                                        const allSelected = courses.every(course => pendingFilters.courses.includes(course));
                                                        if (allSelected) {
                                                            setPendingFilters(prev => ({
                                                                ...prev,
                                                                courses: prev.courses.filter(c => !courses.includes(c))
                                                            }));
                                                        } else {
                                                            setPendingFilters(prev => ({
                                                                ...prev,
                                                                courses: [...new Set([...prev.courses, ...courses])]
                                                            }));
                                                        }
                                                    }}
                                                >
                                                    {courses.every(course => pendingFilters.courses.includes(course)) ? 'Deselect All' : 'Select All'}
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                {courses.map((course) => (
                                                    <div key={course} className="flex items-start space-x-2 p-1 hover:bg-white rounded transition-colors">
                                                        <Checkbox
                                                            id={course}
                                                            checked={pendingFilters.courses.includes(course)}
                                                            onCheckedChange={() => handleCourseToggle(course)}
                                                            className="mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                                        />
                                                        <Label htmlFor={course} className="text-xs font-abel cursor-pointer leading-tight text-gray-700 hover:text-gray-900">
                                                            {course}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>

                    {/* Enhanced Status Filter */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="neutral" className="justify-between h-12 font-abel text-sm md:text-base hover:bg-orange-50 border-2 hover:border-orange-300 transition-all duration-200">
                                <span className="truncate mr-2">Status</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {pendingFilters.statuses.length > 0 && (
                                        <Badge variant="default" className="ml-2 text-xs px-2 py-0 font-abel bg-orange-600 text-white">
                                            {pendingFilters.statuses.length}
                                        </Badge>
                                    )}
                                    <Filter className="h-4 w-4" />
                                </div>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 md:w-[450px] p-0 max-h-[85vh] overflow-hidden shadow-xl border-2">
                            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-semibold font-abel text-base md:text-lg text-orange-900">Select Status</h4>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => {
                                            setPendingFilters(prev => ({ ...prev, statuses: [] }));
                                        }}
                                        className="font-abel text-xs md:text-sm text-orange-700 hover:text-orange-900 hover:bg-orange-100"
                                    >
                                        Clear All
                                    </Button>
                                </div>
                            </div>
                            <ScrollArea className="h-96 bg-white">
                                <div className="px-4 pb-4 pt-2 space-y-2">
                                    {STATUS_OPTIONS.map((option) => (
                                        <div key={option.value} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded transition-colors border border-gray-100">
                                            <Checkbox
                                                id={option.value}
                                                checked={pendingFilters.statuses.includes(option.value)}
                                                onCheckedChange={() => handleStatusToggle(option.value)}
                                                className="mt-1 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                                            />
                                            <Label htmlFor={option.value} className="text-xs font-abel leading-tight cursor-pointer text-gray-700 hover:text-gray-900 flex-1">
                                                {option.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>

                    {/* Enhanced Home University Filter */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="neutral" className="justify-between h-12 font-abel text-sm md:text-base hover:bg-teal-50 border-2 hover:border-teal-300 transition-all duration-200">
                                <span className="truncate mr-2">Home University</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {pendingFilters.homeUniversities.length > 0 && (
                                        <Badge variant="default" className="ml-2 text-xs px-2 py-0 font-abel bg-teal-600 text-white">
                                            {pendingFilters.homeUniversities.length}
                                        </Badge>
                                    )}
                                    <Filter className="h-4 w-4" />
                                </div>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 md:w-[450px] p-0 max-h-[85vh] overflow-hidden shadow-xl border-2">
                            <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-b">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-semibold font-abel text-base md:text-lg text-teal-900">Select Home University</h4>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => {
                                            setPendingFilters(prev => ({ ...prev, homeUniversities: [] }));
                                        }}
                                        className="font-abel text-xs md:text-sm text-teal-700 hover:text-teal-900 hover:bg-teal-100"
                                    >
                                        Clear All
                                    </Button>
                                </div>
                            </div>
                            <ScrollArea className="h-96 bg-white">
                                <div className="px-4 pb-4 pt-2 space-y-2">
                                    {HOME_UNIVERSITY_OPTIONS.map((option) => (
                                        <div key={option.value} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded transition-colors border border-gray-100">
                                            <Checkbox
                                                id={option.value}
                                                checked={pendingFilters.homeUniversities.includes(option.value)}
                                                onCheckedChange={() => handleHomeUniversityToggle(option.value)}
                                                className="mt-1 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                                            />
                                            <Label htmlFor={option.value} className="text-xs font-abel leading-tight cursor-pointer text-gray-700 hover:text-gray-900 flex-1">
                                                {option.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>

                    {/* Enhanced Search and Clear Buttons */}
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto md:ml-auto col-span-full">
                        <Button
                            onClick={applyFilters}
                            disabled={!pendingFilters.percentileInput || !hasUnsavedChanges || isSearching}
                            className="px-6 py-3 font-abel text-sm md:text-base w-full md:w-auto h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                        >
                            {isSearching || loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span className="hidden md:inline">Searching...</span>
                                    <span className="md:hidden">...</span>
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    <span className="hidden md:inline">Search Cutoffs</span>
                                    <span className="md:hidden">Search</span>
                                </>
                            )}
                        </Button>
                        <Button
                            variant="neutral"
                            onClick={clearAllFilters}
                            className="px-4 py-3 font-abel text-sm md:text-base w-full md:w-auto h-12 border-2 hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            <span className="hidden md:inline">Clear All Filters</span>
                            <span className="md:hidden">Clear</span>
                        </Button>
                    </div>
                </div>

                {/* Changes Indicator */}
                {!pendingFilters.percentileInput ? (
                    <div className="flex items-center justify-center gap-2 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></div>
                        <span className="text-xs md:text-sm font-medium text-blue-800 font-abel text-center">
                            Please enter a target percentile to search for cutoffs.
                        </span>
                    </div>
                ) : hasUnsavedChanges ? (
                    <div className="flex items-center justify-center gap-2 p-3 md:p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse flex-shrink-0"></div>
                        <span className="text-xs md:text-sm font-medium text-amber-800 font-abel text-center">
                            You have unsaved filter changes. Click &quot;Search Cutoffs&quot; to apply them.
                        </span>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
