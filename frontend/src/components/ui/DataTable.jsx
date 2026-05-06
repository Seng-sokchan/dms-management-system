import "./DataTable.css";
import { Pagination } from "./Pagination";

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children — table rows (thead + tbody)
 * @param {string} [props.className] — merged onto the scroll wrapper (.table-wrap)
 * @param {string} [props.tableClassName] — extra classes on the table element
 * @param {boolean} [props.showSearch] — render search input + button above table
 * @param {string} [props.searchValue] — controlled search input value
 * @param {(value: string) => void} [props.onSearchValueChange] — search input change handler
 * @param {() => void} [props.onSearch] — search button click handler
 * @param {string} [props.searchPlaceholder] — search input placeholder
 * @param {string} [props.searchButtonLabel] — search button label
 * @param {{ page: number, pageSize: number, totalRows: number, onPageChange: (p: number) => void, onPageSizeChange: (s: number) => void, pageSizeOptions?: number[] }} [props.pagination]
 */
export function DataTable({
  children,
  className = "",
  tableClassName = "",
  showSearch = false,
  searchValue = "",
  onSearchValueChange,
  onSearch,
  searchPlaceholder = "Search...",
  searchButtonLabel = "Search",
  pagination,
}) {
  const wrap = ["table-wrap", className].filter(Boolean).join(" ");
  const tbl = ["data-table", tableClassName].filter(Boolean).join(" ");

  function handleKeyDown(event) {
    if (event.key === "Enter" && typeof onSearch === "function") {
      event.preventDefault();
      onSearch();
    }
  }

  return (
    <>
      {showSearch ? (
        <div className="data-table-search">
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchValueChange?.(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
          <button type="button" className="data-table-search__button" onClick={onSearch}>
            {searchButtonLabel}
          </button>
        </div>
      ) : null}
      <div className={wrap}>
        <table className={tbl}>{children}</table>
        {pagination ? (
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalRows={pagination.totalRows}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
            pageSizeOptions={pagination.pageSizeOptions}
          />
        ) : null}
      </div>
    </>
  );
}
