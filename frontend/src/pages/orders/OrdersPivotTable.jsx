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
}) {
  const { totalsByItem, grandTotal } = computePivotTotals(allRows, itemColumns);
  const showPagination = pagination && pagination.totalRows > pagination.pageSize;

  return (
    <div className="orders-pivot-table-wrap">
      <DataTable
        className="orders-pivot-table-wrap__inner"
        tableClassName="orders-pivot-table"
        pagination={showPagination ? pagination : undefined}
      >
        <thead>
          <tr>
            <th>{customerHeader}</th>
            {itemColumns.map((item) => (
              <th key={item}>{item}</th>
            ))}
            <th>{totalLabel}</th>
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((row) => (
            <tr key={row.customerKey}>
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
          ))}
        </tbody>
        <tfoot>
          <tr className="orders-pivot-table__total-row">
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
