"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, RotateCcw } from "lucide-react";
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
    <div className="bg-white border-2 border-black rounded-base shadow-base overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-main border-2 border-black rounded-base shadow-base">
            <Search className="h-5 w-5 text-black" />
          </div>
          <div>
            <h2 className="text-xl font-heading text-black">🎯 Smart Filter</h2>
            <p className="text-black font-base">
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
                  className="text-black font-heading mb-3 block"
                >
                  📊 Target Percentile
                </Label>
                <div className="space-y-4">
                  {/* Toggle between input methods */}
                  <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!useSlider}
                        onChange={() => setUseSlider(false)}
                        className="w-4 h-4 accent-main"
                      />
                      <span className="text-black font-base">Type value</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={useSlider}
                        onChange={() => setUseSlider(true)}
                        className="w-4 h-4 accent-main"
                      />
                      <span className="text-black font-base">Use slider</span>
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
                      className="border-2 border-black rounded-base focus:border-black focus:ring-0"
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
                        <span className="text-2xl font-heading text-black">
                          {sliderValue[0]}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Range Display */}
                  {currentRange && (
                    <div className="p-4 bg-main border-2 border-black rounded-base">
                      <div className="text-sm">
                        <span className="font-heading text-black">
                          🎯 Search Range:{" "}
                        </span>
                        <span className="text-black font-base">
                          {currentRange.min}% - {currentRange.max}%
                        </span>
                      </div>
                      <p className="text-sm text-black mt-2 font-base">
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
                  className="text-black font-heading mb-3 block"
                >
                  🏫 College Name (Optional)
                </Label>
                <Input
                  id="college"
                  placeholder="e.g., IIT, NIT, COEP, etc."
                  value={collegeFilter}
                  onChange={(e) => setCollegeFilter(e.target.value)}
                  className="border-2 border-black rounded-base focus:border-black focus:ring-0"
                />
              </div>

              <div>
                <Label
                  htmlFor="course"
                  className="text-black font-heading mb-3 block"
                >
                  📚 Course/Branch (Optional)
                </Label>
                <Input
                  id="course"
                  placeholder="e.g., Computer, Mechanical, etc."
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="border-2 border-black rounded-base focus:border-black focus:ring-0"
                />
              </div>

              <div>
                <Label
                  htmlFor="category"
                  className="text-black font-heading mb-3 block"
                >
                  👥 Category
                </Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="border-2 border-black rounded-base focus:border-black focus:ring-0">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-black rounded-base">
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
            <div className="flex flex-col gap-4 h-full justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isLoading || currentPercentile <= 0}
                variant="default"
                className="w-full"
              >
                <Search className="mr-2 h-4 w-4" />
                {isLoading ? "Searching..." : "🔍 Search Cutoffs"}
              </Button>
              <Button
                onClick={handleReset}
                variant="neutral"
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                🔄 Clear All
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
