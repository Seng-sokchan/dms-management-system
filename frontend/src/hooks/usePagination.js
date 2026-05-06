import { useCallback, useEffect, useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Client-side pagination for arrays already loaded in memory.
 *
 * @template T
 * @param {T[]} items
 * @param {{ pageSize?: number, pageSizeOptions?: number[], resetKey?: unknown }} [options]
 */
export function usePagination(items, options = {}) {
  const list = Array.isArray(items) ? items : [];
  const pageSizeOptions = options.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;
  const initialSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const resetKey = options.resetKey;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(() =>
    pageSizeOptions.includes(initialSize) ? initialSize : pageSizeOptions[0] ?? DEFAULT_PAGE_SIZE,
  );

  const totalRows = list.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize) || 1);

  useEffect(() => {
    setPage(1);
  }, [totalRows, resetKey]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const setPageSize = useCallback(
    (next) => {
      const current = pageSize;
      const resolvedRaw = typeof next === "function" ? next(current) : next;
      const resolved = pageSizeOptions.includes(resolvedRaw)
        ? resolvedRaw
        : pageSizeOptions[0] ?? DEFAULT_PAGE_SIZE;
      setPageSizeState(resolved);
      setPage(1);
    },
    [pageSize, pageSizeOptions],
  );

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, page, pageSize]);

  const startIndex = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalRows);

  return {
    page,
    pageSize,
    pageSizeOptions,
    totalRows,
    totalPages,
    paged,
    startIndex,
    endIndex,
    setPage,
    setPageSize,
  };
}
