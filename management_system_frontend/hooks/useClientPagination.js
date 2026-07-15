"use client";

import { useMemo, useState, useEffect } from "react";

export const PAGE_SIZE_OPTIONS = [10, 20, 25, 50];
export const PAGINATION_MIN_ROWS = 10;

/**
 * Client-side pagination. Controls only render when totalItems > PAGINATION_MIN_ROWS.
 */
export function useClientPagination(items = [], defaultPageSize = 10) {
  const list = Array.isArray(items) ? items : [];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalItems = list.length;
  const showPagination = totalItems > PAGINATION_MIN_ROWS;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage(1);
  }, [pageSize, totalItems]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    if (!showPagination) return list;
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, page, pageSize, showPagination]);

  return {
    pageItems,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    showPagination,
    from: totalItems === 0 ? 0 : (page - 1) * pageSize + 1,
    to: Math.min(page * pageSize, totalItems),
  };
}
