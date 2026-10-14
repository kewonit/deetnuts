"use client";

import { FilterSidebar, type FilterSidebarProps } from "./FilterSidebar";

interface MobileFilterToastProps extends FilterSidebarProps {
  onApply: () => void;
  onClose: () => void;
}

// Bottom sheet that holds the sidebar on narrow screens. Changes apply as you make them.
export function MobileFilterToast({ onApply, onClose, ...filterSidebarProps }: MobileFilterToastProps) {
  return (
    <FilterSidebar
      {...filterSidebarProps}
      className="mht-sheet"
      header={
        <div className="mht-sheet-head">
          <h2>Filters</h2>
          <button type="button" className="mht-btn mht-btn-sm mht-btn-icon" aria-label="Close filters" onClick={onClose}>
            ×
          </button>
        </div>
      }
      footer={
        <div className="mht-side-foot">
          {filterSidebarProps.activeFilterCount > 0 ? (
            <button type="button" className="mht-btn mht-btn-sm mht-btn-ghost" onClick={filterSidebarProps.onClearAll}>
              Reset all
            </button>
          ) : (
            <span />
          )}
          <button type="button" className="mht-btn mht-btn-primary" onClick={onApply}>
            Done
          </button>
        </div>
      }
    />
  );
}
