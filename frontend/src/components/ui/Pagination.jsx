import { useTranslation } from "react-i18next";
import "./Pagination.css";

/**
 * Build page numbers with ellipsis for compact display.
 * @param {number} current
 * @param {number} total
 * @returns {(number | "ellipsis")[]}
 */
export function getPaginationRange(current, total) {
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const range = [];
  for (let i = 1; i <= total; i += 1) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      range.push(i);
    }
  }
  const withDots = [];
  let prev = 0;
  for (const i of range) {
    if (prev && i - prev > 1) {
      withDots.push("ellipsis");
    }
    withDots.push(i);
    prev = i;
  }
  return withDots;
}

/**
 * @param {object} props
 * @param {number} props.page — 1-based
 * @param {number} props.pageSize
 * @param {number} props.totalRows
 * @param {(p: number) => void} props.onPageChange
 * @param {(size: number) => void} props.onPageSizeChange
 * @param {number[]} [props.pageSizeOptions]
 */
export function Pagination({
  page,
  pageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize) || 1);
  const startIndex = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalRows);
  const range = getPaginationRange(page, totalPages);

  return (
    <div className="pagination-bar" role="navigation" aria-label={t("pagination.navLabel")}>
      <div className="pagination-bar__summary">
        {totalRows === 0 ? (
          <span className="pagination-bar__text">{t("pagination.empty")}</span>
        ) : (
          <span className="pagination-bar__text">
            {t("pagination.showing", { from: startIndex, to: endIndex, total: totalRows })}
          </span>
        )}
      </div>
      <div className="pagination-bar__controls">
        <label className="pagination-bar__size-label">
          <span className="pagination-bar__size-text">{t("pagination.rowsPerPage")}</span>
          <select
            className="pagination-bar__size-select"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            aria-label={t("pagination.rowsPerPage")}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="pagination-bar__page-meta">{t("pagination.page", { page, total: totalPages })}</span>
        <div className="pagination-bar__buttons">
          <button
            type="button"
            className="pagination-bar__btn"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            aria-label={t("pagination.first")}
          >
            {t("pagination.first")}
          </button>
          <button
            type="button"
            className="pagination-bar__btn"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label={t("pagination.previous")}
          >
            {t("pagination.previous")}
          </button>
          {range.map((item, idx) =>
            item === "ellipsis" ? (
              <span key={`e-${idx}`} className="pagination-bar__ellipsis" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={`pagination-bar__num${item === page ? " pagination-bar__num--active" : ""}`}
                onClick={() => onPageChange(item)}
                aria-label={t("pagination.goToPage", { page: item })}
                aria-current={item === page ? "page" : undefined}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            className="pagination-bar__btn"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label={t("pagination.next")}
          >
            {t("pagination.next")}
          </button>
          <button
            type="button"
            className="pagination-bar__btn"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            aria-label={t("pagination.last")}
          >
            {t("pagination.last")}
          </button>
        </div>
      </div>
    </div>
  );
}
