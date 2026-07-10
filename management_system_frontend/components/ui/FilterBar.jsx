"use client";

import {
  FilterClearButton,
  FilterDate,
  FilterSearch,
  FilterSelect,
  getFilterFieldClass,
} from "./FilterControls";

function DateRangeFields({ dateRange, useFixedWidth = false }) {
  if (!dateRange) return null;

  const fieldClass = useFixedWidth ? "filter-field" : "min-w-0";

  return (
    <>
      <FilterDate
        id="startDate"
        label={dateRange.startLabel}
        value={dateRange.startDate}
        onChange={(e) => dateRange.onStartChange(e.target.value)}
        fieldClassName={fieldClass}
      />
      <FilterDate
        id="endDate"
        label={dateRange.endLabel}
        value={dateRange.endDate}
        onChange={(e) => dateRange.onEndChange(e.target.value)}
        fieldClassName={fieldClass}
      />
    </>
  );
}

function DefaultFilterPanel({ filters, dateRange }) {
  return (
    <div className="filter-panel">
      {filters.map((filter) => (
        <FilterSelect
          key={filter.key}
          id={filter.key}
          label={filter.label}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          options={filter.options}
          placeholder={filter.placeholder || "All"}
          fieldClassName="min-w-0 w-full"
        />
      ))}
      {dateRange ? <DateRangeFields dateRange={dateRange} /> : null}
    </div>
  );
}

function TwoRowFilterPanel({ filters, dateRange }) {
  return (
    <div className="filter-panel-wide">
      <div className="flex flex-wrap items-end justify-end gap-3">
        {filters.map((filter) => (
          <FilterSelect
            key={filter.key}
            id={filter.key}
            label={filter.label}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            options={filter.options}
            placeholder={filter.placeholder || "All"}
            fieldClassName={getFilterFieldClass(filter.key)}
          />
        ))}
      </div>
      {dateRange ? (
        <div className="flex flex-wrap items-end justify-end gap-3">
          <DateRangeFields dateRange={dateRange} useFixedWidth />
        </div>
      ) : null}
    </div>
  );
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  dateRange,
  onClear,
  hasActiveFilters,
  filtersLayout = "default",
}) {
  const clearAlignClass =
    filtersLayout === "twoRow"
      ? "justify-end"
      : "justify-end lg:max-w-[var(--filter-panel-max-width)] lg:ml-auto";

  return (
    <div>
      <div
        className={`flex flex-col gap-3 ${
          filtersLayout === "twoRow"
            ? "md:flex-row md:items-end md:justify-between"
            : "lg:flex-row lg:items-end"
        }`}
      >
        {onSearchChange ? (
          <FilterSearch
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        ) : null}

        {filtersLayout === "twoRow" ? (
          <TwoRowFilterPanel filters={filters} dateRange={dateRange} />
        ) : (
          <DefaultFilterPanel filters={filters} dateRange={dateRange} />
        )}
      </div>

      {onClear ? (
        <div className={`mt-2 flex h-5 ${clearAlignClass}`}>
          <FilterClearButton visible={hasActiveFilters} onClick={onClear} />
        </div>
      ) : null}
    </div>
  );
}
