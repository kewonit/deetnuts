'use client';

import { Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FilterState } from '../types';
import { getDisplayNameForRound } from '../constants';

interface ActiveFiltersDisplayProps {
    filters: FilterState;
    clearAllFilters: () => void;
}

export function ActiveFiltersDisplay({
    filters,
    clearAllFilters,
}: ActiveFiltersDisplayProps) {
    if (!filters.percentileInput &&
        filters.categories.length === 0 &&
        filters.courses.length === 0 &&
        filters.statuses.length === 0 &&
        filters.homeUniversities.length === 0 &&
        filters.round === 1) {
        return null;
    }

    return (
        <Card className="bg-blue-100 border-blue-300 rounded-lg shadow-md">
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Filter className="h-6 w-6 text-blue-700 flex-shrink-0" />
                    <h3 className="text-lg sm:text-xl font-bold text-blue-900 font-abel">Active Filters</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                    {filters.round !== 1 && (
                        <Badge variant="default" className="bg-purple-200 text-purple-900 font-abel text-sm sm:text-base">
                            {getDisplayNameForRound(filters.round)}
                        </Badge>
                    )}
                    {filters.percentileInput && (
                        <Badge variant="default" className="bg-blue-200 text-blue-900 font-abel text-sm sm:text-base">
                            Target: {filters.percentileInput}%
                        </Badge>
                    )}
                    {filters.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="default" className="bg-green-200 text-green-900 font-abel text-sm sm:text-base">
                                Categories ({filters.categories.length})
                            </Badge>
                            {filters.categories.map((category, index) => (
                                <Badge key={index} variant="neutral" className="bg-green-100 text-green-800 font-abel text-sm sm:text-base">
                                    {category}
                                </Badge>
                            ))}
                        </div>
                    )}
                    {filters.courses.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="default" className="bg-orange-200 text-orange-900 font-abel text-sm sm:text-base">
                                Courses ({filters.courses.length})
                            </Badge>
                            {filters.courses.map((course, index) => (
                                <Badge key={index} variant="neutral" className="bg-orange-100 text-orange-800 font-abel text-sm sm:text-base">
                                    {course.length > 20 ? `${course.substring(0, 20)}...` : course}
                                </Badge>
                            ))}
                        </div>
                    )}
                    {filters.statuses.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="default" className="bg-red-200 text-red-900 font-abel text-sm sm:text-base">
                                Status ({filters.statuses.length})
                            </Badge>
                            {filters.statuses.map((status, index) => (
                                <Badge key={index} variant="neutral" className="bg-red-100 text-red-800 font-abel text-sm sm:text-base">
                                    {status.length > 25 ? `${status.substring(0, 25)}...` : status}
                                </Badge>
                            ))}
                        </div>
                    )}
                    {filters.homeUniversities.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="default" className="bg-teal-200 text-teal-900 font-abel text-sm sm:text-base">
                                Universities ({filters.homeUniversities.length})
                            </Badge>
                            {filters.homeUniversities.map((university, index) => (
                                <Badge key={index} variant="neutral" className="bg-teal-100 text-teal-800 font-abel text-sm sm:text-base">
                                    {university.length > 30 ? `${university.substring(0, 30)}...` : university}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
                <div className="mt-4 flex justify-end">
                    <Button
                        variant="neutral"
                        onClick={clearAllFilters}
                        className="px-2 py-1 font-abel text-xs md:text-sm h-8 md:h-9 rounded-md border border-blue-200 bg-white text-blue-900 hover:bg-blue-50 shadow-sm transition-all duration-150"
                    >
                        Clear All Filters
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
