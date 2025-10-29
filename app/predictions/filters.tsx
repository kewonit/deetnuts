'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter, TrendingDown, TrendingUp } from 'lucide-react';
import { PredictionFilters, SEAT_TYPE_LABELS, QUOTA_LABELS } from './types';

interface PredictionFiltersProps {
    filters: PredictionFilters;
    pendingFilters: PredictionFilters;
    setPendingFilters: (filters: PredictionFilters) => void;
    availableInstitutes: string[];
    availableBranches: string[];
    availableSeatTypes: string[];
    availableQuotas: string[];
    hasUnsavedChanges: boolean;
    isSearching: boolean;
    loading: boolean;
    applyFilters: () => void;
    clearAllFilters: () => void;
}

export function PredictionFiltersComponent({
    filters,
    pendingFilters,
    setPendingFilters,
    availableInstitutes,
    availableBranches,
    availableSeatTypes,
    availableQuotas,
    hasUnsavedChanges,
    isSearching,
    loading,
    applyFilters,
    clearAllFilters,
}: PredictionFiltersProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const updateFilter = <K extends keyof PredictionFilters>(
        key: K,
        value: PredictionFilters[K]
    ) => {
        setPendingFilters({ ...pendingFilters, [key]: value });
    };

    const activeFilterCount = Object.values(filters).filter(
        (v) => v !== '' && v !== null
    ).length;

    return (
        <Card className="border-2 border-black shadow-base">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 font-heading text-2xl">
                            <Filter className="h-5 w-5" />
                            Filter Predictions
                        </CardTitle>
                        <CardDescription className="font-inter mt-2">
                            Refine your search to find specific college predictions for 2026
                        </CardDescription>
                    </div>
                    {activeFilterCount > 0 && (
                        <Badge variant="default" className="text-sm">
                            {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Search */}
                <div className="space-y-2">
                    <Label htmlFor="search" className="font-heading">
                        Search
                    </Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <Input
                            id="search"
                            placeholder="Search by institute, branch, or seat ID..."
                            value={pendingFilters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            className="pl-10 border-2 border-black"
                        />
                    </div>
                </div>

                {/* Primary Filters */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                        <Label htmlFor="institute" className="font-heading">
                            Institute
                        </Label>
                        <Select
                            value={pendingFilters.institute || 'all'}
                            onValueChange={(value) => updateFilter('institute', value === 'all' ? '' : value)}
                        >
                            <SelectTrigger className="border-2 border-black">
                                <SelectValue placeholder="All Institutes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Institutes</SelectItem>
                                {availableInstitutes.map((institute) => (
                                    <SelectItem key={institute} value={institute}>
                                        {institute}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="branch" className="font-heading">
                            Branch
                        </Label>
                        <Select
                            value={pendingFilters.branch || 'all'}
                            onValueChange={(value) => updateFilter('branch', value === 'all' ? '' : value)}
                        >
                            <SelectTrigger className="border-2 border-black">
                                <SelectValue placeholder="All Branches" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {availableBranches.map((branch) => (
                                    <SelectItem key={branch} value={branch}>
                                        {branch}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="seatType" className="font-heading">
                            Seat Type
                        </Label>
                        <Select
                            value={pendingFilters.seatType || 'all'}
                            onValueChange={(value) => updateFilter('seatType', value === 'all' ? '' : value)}
                        >
                            <SelectTrigger className="border-2 border-black">
                                <SelectValue placeholder="All Seat Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Seat Types</SelectItem>
                                {availableSeatTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {SEAT_TYPE_LABELS[type] || type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quota" className="font-heading">
                            Quota
                        </Label>
                        <Select
                            value={pendingFilters.quota || 'all'}
                            onValueChange={(value) => updateFilter('quota', value === 'all' ? '' : value)}
                        >
                            <SelectTrigger className="border-2 border-black">
                                <SelectValue placeholder="All Quotas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Quotas</SelectItem>
                                {availableQuotas.map((quota) => (
                                    <SelectItem key={quota} value={quota}>
                                        {QUOTA_LABELS[quota] || quota}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Advanced Filters Toggle */}
                <Button
                    variant="neutral"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full border-2 border-black"
                >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
                </Button>

                {/* Advanced Filters */}
                {showAdvanced && (
                    <div className="space-y-4 rounded-lg border-2 border-black p-4 bg-gray-50">
                        <h3 className="font-heading text-lg">
                            Range Filters
                        </h3>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Predicted Cutoff Range */}
                            <div className="space-y-3">
                                <Label className="font-heading text-base">
                                    Predicted Cutoff 2026
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="minCutoff" className="text-xs text-gray-600">
                                            Min Rank
                                        </Label>
                                        <Input
                                            id="minCutoff"
                                            type="number"
                                            min="0"
                                            placeholder="Min"
                                            value={pendingFilters.minCutoff ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value ? parseFloat(e.target.value) : null;
                                                updateFilter('minCutoff', val !== null && !isNaN(val) ? val : null);
                                            }}
                                            className="border-2 border-black"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="maxCutoff" className="text-xs text-gray-600">
                                            Max Rank
                                        </Label>
                                        <Input
                                            id="maxCutoff"
                                            type="number"
                                            min="0"
                                            placeholder="Max"
                                            value={pendingFilters.maxCutoff ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value ? parseFloat(e.target.value) : null;
                                                updateFilter('maxCutoff', val !== null && !isNaN(val) ? val : null);
                                            }}
                                            className="border-2 border-black"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Change from 2025 Range */}
                            <div className="space-y-3">
                                <Label className="font-heading text-base">
                                    Change from 2025
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="minChange" className="text-xs text-gray-600">
                                            Min Change
                                        </Label>
                                        <Input
                                            id="minChange"
                                            type="number"
                                            placeholder="Min (e.g., -1000)"
                                            value={pendingFilters.minChange ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value ? parseFloat(e.target.value) : null;
                                                updateFilter('minChange', val !== null && !isNaN(val) ? val : null);
                                            }}
                                            className="border-2 border-black"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="maxChange" className="text-xs text-gray-600">
                                            Max Change
                                        </Label>
                                        <Input
                                            id="maxChange"
                                            type="number"
                                            placeholder="Max (e.g., 1000)"
                                            value={pendingFilters.maxChange ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value ? parseFloat(e.target.value) : null;
                                                updateFilter('maxChange', val !== null && !isNaN(val) ? val : null);
                                            }}
                                            className="border-2 border-black"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={applyFilters}
                        disabled={!hasUnsavedChanges || isSearching || loading}
                        className="flex-1 min-w-[150px] border-2 border-black font-heading"
                    >
                        {isSearching ? 'Applying...' : 'Apply Filters'}
                    </Button>
                    <Button
                        variant="neutral"
                        onClick={clearAllFilters}
                        disabled={activeFilterCount === 0 || loading}
                        className="flex-1 min-w-[150px] border-2 border-black font-heading"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Clear All
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
