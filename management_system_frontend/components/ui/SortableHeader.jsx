"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export function SortableHeader({ label, column, currentSort, onSort, className = "" }) {
  const [activeCol, direction] = (currentSort || "").split(":");
  const isActive = activeCol === column;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`inline-flex items-center gap-1 text-left uppercase tracking-wide transition-colors hover:text-text-primary ${className}`}
    >
      <span>{label}</span>
      {isActive ? (
        direction === "desc" ? (
          <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUp className="h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
      )}
    </button>
  );
}
