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

  const fieldClass = useFixedWidth ? "filter-field" : "min-w-0 w-full";

  const fields = (
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

  if (useFixedWidth) {
    return <div className="filter-date-pair">{fields}</div>;
  }

  return fields;
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

/**
 * Row 1: dropdown filters (right-aligned, same edge as table)
 * Row 2: search left + dates right (same right edge as row 1)
 */
function TwoRowFilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  dateRange,
}) {
  return (
    <div className="filter-toolbar">
      <div className="filter-toolbar-end">
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

      <div className="filter-toolbar-bottom">
        {onSearchChange ? (
          <FilterSearch
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="filter-toolbar-search"
          />
        ) : null}
        {dateRange ? (
          <div className="filter-toolbar-end">
            <DateRangeFields dateRange={dateRange} useFixedWidth />
          </div>
        ) : null}
      </div>
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

  if (filtersLayout === "twoRow") {
    return (
      <div>
        <TwoRowFilterToolbar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          filters={filters}
          dateRange={dateRange}
        />
        {onClear ? (
          <div className={`mt-2 flex h-5 ${clearAlignClass}`}>
            <FilterClearButton visible={hasActiveFilters} onClick={onClear} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        {onSearchChange ? (
          <FilterSearch
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        ) : null}
        <DefaultFilterPanel filters={filters} dateRange={dateRange} />
      </div>

      {onClear ? (
        <div className={`mt-2 flex h-5 ${clearAlignClass}`}>
          <FilterClearButton visible={hasActiveFilters} onClick={onClear} />
        </div>
      ) : null}
    </div>
  );
}
