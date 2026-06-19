"use client";

import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { FilterSidebar, type FilterSidebarProps } from "./FilterSidebar";

interface MobileFilterToastProps extends FilterSidebarProps {
  onApply: () => void;
  onClose: () => void;
}

export function MobileFilterToast({
  onApply,
  onClose,
  activeFilterCount,
  ...filterSidebarProps
}: MobileFilterToastProps) {
  return (
    <div className="w-full max-w-[420px] overflow-hidden rounded-[28px] border-2 border-black bg-[#fffdf5] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="h-[min(82dvh,680px)] max-h-[calc(100dvh-1.5rem)]">
        <FilterSidebar
          {...filterSidebarProps}
          activeFilterCount={activeFilterCount}
          className="h-full bg-transparent"
          headerActions={
            <Button
              variant="neutral"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-md"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close filters</span>
            </Button>
          }
          footer={
            <div className="border-t-2 border-black bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-gray-600">
                  {activeFilterCount > 0
                    ? `${activeFilterCount} filters active. Changes apply live.`
                    : "Changes apply live as you edit."}
                </p>
                <Button onClick={onApply} className="shrink-0 gap-2">
                  <Check className="h-4 w-4" />
                  Done
                </Button>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
