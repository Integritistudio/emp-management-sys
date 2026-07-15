"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "@/hooks/useClientPagination";

export function Pagination({
  page,
  totalPages,
  pageSize,
  totalItems,
  from,
  to,
  onPageChange,
  onPageSizeChange,
  show = true,
}) {
  if (!show || totalItems <= 10) return null;

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border-light bg-surface px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-text-secondary">
        Showing <span className="font-medium text-text-primary">{from}</span>
        –
        <span className="font-medium text-text-primary">{to}</span> of{" "}
        <span className="font-medium text-text-primary">{totalItems}</span>
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-text-secondary">
          Rows
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-md border border-border bg-surface px-2 text-sm text-text-primary focus:border-primary focus:outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary transition hover:bg-parchment disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[4.5rem] text-center text-xs font-medium text-text-primary">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary transition hover:bg-parchment disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
