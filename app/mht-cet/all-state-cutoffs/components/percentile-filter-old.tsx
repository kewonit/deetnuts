"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, RotateCcw, Target } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface PercentileFilterProps {
  onFilterApply: (filters: {
    minPercentile: number;
    maxPercentile: number;
    collegeFilter: string;
    courseFilter: string;
    categoryFilter: string;
    allocationFilter: string;
  }) => void;
  isLoading?: boolean;
}

export function PercentileFilter({
  onFilterApply,
  isLoading = false,
}: PercentileFilterProps) {
  const [targetPercentile, setTargetPercentile] = useState<string>("");
  const [useSlider, setUseSlider] = useState(false);
  const [sliderValue, setSliderValue] = useState([75]);
  const [collegeFilter, setCollegeFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Sync slider with input when switching modes
  useEffect(() => {
    if (useSlider && targetPercentile && !isNaN(parseFloat(targetPercentile))) {
      setSliderValue([parseFloat(targetPercentile)]);
    } else if (!useSlider && sliderValue[0]) {
      setTargetPercentile(sliderValue[0].toString());
    }
  }, [useSlider, targetPercentile, sliderValue]);

  // Calculate the actual range with ±1
  const getPercentileRange = (target: number) => {
    const min = Math.max(0, target - 1);
    const max = Math.min(100, target + 1);
    return { min, max };
  };

  // Get current percentile value regardless of input method
  const getCurrentPercentile = () => {
    if (useSlider) {
      return sliderValue[0];
    }
    return parseFloat(targetPercentile) || 0;
  };

  const currentPercentile = getCurrentPercentile();
  const currentRange =
    currentPercentile > 0 ? getPercentileRange(currentPercentile) : null;

  const handleSubmit = () => {
    const target = getCurrentPercentile();
    if (target <= 0) {
      return;
    }

    const range = getPercentileRange(target);

    onFilterApply({
      minPercentile: range.min,
      maxPercentile: range.max,
      collegeFilter: collegeFilter.trim(),
      courseFilter: courseFilter.trim(),
      categoryFilter: selectedCategory === "ALL" ? "" : selectedCategory,
      allocationFilter: "",
    });
  };

  const handleReset = () => {
    setTargetPercentile("");
    setSliderValue([75]);
    setUseSlider(false);
    setCollegeFilter("");
    setCourseFilter("");
    setSelectedCategory("ALL");
    onFilterApply({
      minPercentile: 0,
      maxPercentile: 100,
      collegeFilter: "",
      courseFilter: "",
      categoryFilter: "",
      allocationFilter: "",
    });
  };

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    setTargetPercentile(value[0].toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTargetPercentile(value);
    if (value && !isNaN(parseFloat(value))) {
      setSliderValue([parseFloat(value)]);
    }
  };

  const getPercentileAdvice = (percentile: number) => {
    if (percentile >= 95) return "Top tier colleges available! 🎯";
    if (percentile >= 85) return "Great colleges within reach! 🚀";
    if (percentile >= 70) return "Good college options available 📚";
    if (percentile >= 50) return "Multiple options to explore 🔍";
    return "Consider all available options 💪";
  };

  return (
    <Card className="border border-gray-200 shadow-sm mb-6">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Search className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Smart Filter
            </h2>
            <p className="text-sm text-gray-600">
              Find cutoffs based on your percentile and preferences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Percentile Input Section */}
          <div className="lg:col-span-4">
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="percentile"
                  className="text-sm font-medium text-gray-900"
                >
                  Target Percentile
                </Label>
                <div className="mt-2 space-y-3">
                  {/* Toggle between input methods */}
                  <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!useSlider}
                        onChange={() => setUseSlider(false)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Type value</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={useSlider}
                        onChange={() => setUseSlider(true)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Use slider</span>
                    </label>
                  </div>

                  {/* Input Method */}
                  {!useSlider ? (
                    <Input
                      id="percentile"
                      type="number"
                      placeholder="Enter your percentile (0-100)"
                      value={targetPercentile}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      step="0.1"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="space-y-3">
                      <Slider
                        value={sliderValue}
                        onValueChange={handleSliderChange}
                        max={100}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-center">
                        <span className="text-lg font-bold text-blue-600">
                          {sliderValue[0]}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Range Display */}
                  {currentRange && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm">
                        <span className="font-medium text-blue-900">
                          Search Range:{" "}
                        </span>
                        <span className="text-blue-700">
                          {currentRange.min}% - {currentRange.max}%
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        {getPercentileAdvice(currentPercentile)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* College & Course Filters */}
          <div className="lg:col-span-5">
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="college"
                  className="text-sm font-medium text-gray-900"
                >
                  College Name (Optional)
                </Label>
                <Input
                  id="college"
                  placeholder="e.g., IIT, NIT, COEP, etc."
                  value={collegeFilter}
                  onChange={(e) => setCollegeFilter(e.target.value)}
                  className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label
                  htmlFor="course"
                  className="text-sm font-medium text-gray-900"
                >
                  Course/Branch (Optional)
                </Label>
                <Input
                  id="course"
                  placeholder="e.g., Computer, Mechanical, etc."
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label
                  htmlFor="category"
                  className="text-sm font-medium text-gray-900"
                >
                  Category
                </Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    <SelectItem value="OPEN">Open (General)</SelectItem>
                    <SelectItem value="OBC">OBC</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="ST">ST</SelectItem>
                    <SelectItem value="EWS">EWS</SelectItem>
                    <SelectItem value="NT-B">NT-B</SelectItem>
                    <SelectItem value="NT-C">NT-C</SelectItem>
                    <SelectItem value="NT-D">NT-D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="lg:col-span-3">
            <div className="flex flex-col gap-3 h-full justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isLoading || currentPercentile <= 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Search className="mr-2 h-4 w-4" />
                {isLoading ? "Searching..." : "Search Cutoffs"}
              </Button>
              <Button
                onClick={handleReset}
                variant="neutral"
                className="w-full border border-gray-300 hover:bg-gray-50"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
