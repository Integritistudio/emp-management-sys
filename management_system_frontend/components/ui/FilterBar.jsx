"use client";

import { SearchInput } from "./SearchInput";
import { Select } from "./Select";

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  dateRange,
  onClear,
  hasActiveFilters,
}) {
  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        {onSearchChange ? (
          <SearchInput
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="lg:max-w-sm lg:flex-1"
          />
        ) : null}

        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-xl lg:ml-auto">
          {filters.map((filter) => (
            <Select
              key={filter.key}
              id={filter.key}
              label={filter.label}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              options={filter.options}
              placeholder={filter.placeholder || "All"}
            />
          ))}

          {dateRange ? (
            <>
              <div>
                <label
                  htmlFor="startDate"
                  className="mb-2 block text-caption-strong text-text-primary"
                >
                  {dateRange.startLabel}
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => dateRange.onStartChange(e.target.value)}
                  className="h-11 w-full rounded-md border border-border bg-surface px-4 text-body text-text-primary focus:border-primary focus:outline-none focus:outline-2 focus:outline-offset-0 focus:outline-primary-focus"
                />
              </div>
              <div>
                <label
                  htmlFor="endDate"
                  className="mb-2 block text-caption-strong text-text-primary"
                >
                  {dateRange.endLabel}
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => dateRange.onEndChange(e.target.value)}
                  className="h-11 w-full rounded-md border border-border bg-surface px-4 text-body text-text-primary focus:border-primary focus:outline-none focus:outline-2 focus:outline-offset-0 focus:outline-primary-focus"
                />
              </div>
            </>
          ) : null}
        </div>
      </div>

      {onClear ? (
        <div className="mt-2 flex h-5 justify-end lg:max-w-xl lg:ml-auto">
          <button
            type="button"
            onClick={onClear}
            className={`text-sm font-medium text-primary hover:text-primary-hover ${
              hasActiveFilters ? "visible" : "invisible pointer-events-none"
            }`}
            tabIndex={hasActiveFilters ? 0 : -1}
            aria-hidden={!hasActiveFilters}
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
