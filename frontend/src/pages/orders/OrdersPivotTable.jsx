import { DataTable } from "../../components/ui/DataTable";
import { computePivotTotals, sumRowQty } from "./ordersTodayUtils";

export function OrdersPivotTable({
  itemColumns,
  pagedRows,
  allRows,
  dash,
  pagination,
  customerHeader,
  totalLabel,
  showSearch = false,
  searchValue,
  onSearchValueChange,
  onSearch,
  searchPlaceholder,
  searchButtonLabel,
  selectable = false,
  selectedKeys,
  onToggleKey,
  onToggleAllVisible,
  selectAllLabel,
  selectRowLabel,
  checkColClassName = "orders-pivot-check-col",
}) {
  const { totalsByItem, grandTotal } = computePivotTotals(allRows, itemColumns);
  const showPagination = pagination && pagination.totalRows > pagination.pageSize;
  const selected = selectedKeys instanceof Set ? selectedKeys : new Set(selectedKeys || []);
  const visibleKeys = (pagedRows || []).map((row) => row.customerKey);
  const allVisibleSelected =
    selectable && visibleKeys.length > 0 && visibleKeys.every((key) => selected.has(key));
  const someVisibleSelected =
    selectable && visibleKeys.some((key) => selected.has(key));

  return (
    <div className="orders-pivot-table-wrap">
      <DataTable
        className="orders-pivot-table-wrap__inner"
        tableClassName="orders-pivot-table"
        showSearch={showSearch}
        searchValue={searchValue}
        onSearchValueChange={onSearchValueChange}
        onSearch={onSearch}
        searchPlaceholder={searchPlaceholder}
        searchButtonLabel={searchButtonLabel}
        pagination={showPagination ? pagination : undefined}
      >
        <thead>
          <tr>
            {selectable ? (
              <th className={checkColClassName}>
                <input
                  type="checkbox"
                  aria-label={selectAllLabel}
                  checked={allVisibleSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected;
                  }}
                  disabled={visibleKeys.length === 0}
                  onChange={onToggleAllVisible}
                />
              </th>
            ) : null}
            <th>{customerHeader}</th>
            {itemColumns.map((item) => (
              <th key={item}>{item}</th>
            ))}
            <th>{totalLabel}</th>
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((row) => {
            const isSelected = selected.has(row.customerKey);
            return (
              <tr key={row.customerKey}>
                {selectable ? (
                  <td className={checkColClassName}>
                    <input
                      type="checkbox"
                      aria-label={
                        typeof selectRowLabel === "function"
                          ? selectRowLabel(row)
                          : selectRowLabel
                      }
                      checked={isSelected}
                      onChange={() => onToggleKey?.(row.customerKey)}
                    />
                  </td>
                ) : null}
                <td>{row.customerLabel}</td>
                {itemColumns.map((item) => (
                  <td key={item} className="orders-pivot-table__qty">
                    {row.qtyByItem[item] != null ? (
                      <span className="qty-chip">{row.qtyByItem[item]}</span>
                    ) : (
                      dash
                    )}
                  </td>
                ))}
                <td className="orders-pivot-table__qty">
                  <span className="qty-chip">{sumRowQty(row, itemColumns)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="orders-pivot-table__total-row">
            {selectable ? <th scope="row" className={checkColClassName} /> : null}
            <th scope="row">{totalLabel}</th>
            {itemColumns.map((item) => (
              <td key={item} className="orders-pivot-table__qty">
                <span className="qty-chip qty-chip--total">{totalsByItem[item]}</span>
              </td>
            ))}
            <td className="orders-pivot-table__qty">
              <span className="qty-chip qty-chip--total">{grandTotal}</span>
            </td>
          </tr>
        </tfoot>
      </DataTable>
    </div>
  );
}
