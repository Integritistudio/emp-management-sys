"use client";

import { useClientPagination } from "@/hooks/useClientPagination";
import { Pagination } from "@/components/ui/Pagination";

/**
 * Wraps a table with client pagination. Pass full row list as `items`;
 * children receive the current page slice.
 */
export function PaginatedTable({
  items = [],
  defaultPageSize = 10,
  children,
  className = "",
}) {
  const pagination = useClientPagination(items, defaultPageSize);

  return (
    <div className={className}>
      {typeof children === "function"
        ? children(pagination.pageItems)
        : children}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        from={pagination.from}
        to={pagination.to}
        show={pagination.showPagination}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </div>
  );
}
