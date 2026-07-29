import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../../hooks/usePagination";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { OrdersPivotTable } from "./OrdersPivotTable";
import {
  filterOrdersCreatedToday,
  formatTodayLabel,
  pivotOrdersByCustomer,
} from "./ordersTodayUtils";
import "../OrdersPage.css";

export function OrdersByProvincePage({ orders }) {
  const { t } = useTranslation();
  const [activeProvince, setActiveProvince] = useState(null);
  const [provinceSearchText, setProvinceSearchText] = useState("");
  const [appliedProvinceSearch, setAppliedProvinceSearch] = useState("");

  const dash = t("orders.dash");
  const todayLabel = useMemo(() => formatTodayLabel(), []);
  const todayOrders = useMemo(() => filterOrdersCreatedToday(orders), [orders]);

  const groupedByProvince = useMemo(() => {
    const map = new Map();
    todayOrders.forEach((order) => {
      const id =
        order.customerProvinceId != null && String(order.customerProvinceId).trim() !== ""
          ? String(order.customerProvinceId)
          : null;
      const key = id ?? "__unassigned__";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(order);
    });
    return Array.from(map.entries())
      .map(([provinceKey, rows]) => {
        const nameFromOrder = rows.find((r) => r.customerProvinceName)?.customerProvinceName;
        const provinceLabel =
          nameFromOrder ||
          (provinceKey === "__unassigned__" ? t("orders.unassignedProvince") : dash);
        const qty = rows.reduce((sum, row) => sum + Number(row.orderedQty || 0), 0);
        return {
          provinceKey,
          provinceLabel,
          rows,
          qty,
        };
      })
      .sort((a, b) => a.provinceLabel.localeCompare(b.provinceLabel));
  }, [todayOrders, t, dash]);

  const filteredGroupedProvinces = useMemo(() => {
    const keyword = appliedProvinceSearch.trim().toLowerCase();
    if (!keyword) return groupedByProvince;
    return groupedByProvince.filter((row) =>
      [row.provinceLabel, row.qty]
        .filter((value) => value != null && value !== "")
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [groupedByProvince, appliedProvinceSearch]);

  const {
    page: provincePage,
    pageSize: provincePageSize,
    paged: pagedGroupedProvinces,
    setPage: setProvincePage,
    setPageSize: setProvincePageSize,
  } = usePagination(filteredGroupedProvinces, { resetKey: appliedProvinceSearch });

  const pivotedProvince = useMemo(
    () => pivotOrdersByCustomer(activeProvince?.rows ?? [], dash),
    [activeProvince?.rows, dash],
  );

  const {
    page: modalProvinceOrderPage,
    pageSize: modalProvinceOrderPageSize,
    paged: pagedModalProvinceRows,
    setPage: setModalProvinceOrderPage,
    setPageSize: setModalProvinceOrderPageSize,
  } = usePagination(pivotedProvince.rows, { resetKey: activeProvince?.provinceKey ?? "" });

  return (
    <section className="admin-page orders-page-panels">
      <div className="section-heading">
        <h2>{t("orders.byProvince")}</h2>
        <p className="section-lead">{t("orders.lead")}</p>
        <p className="form-hint">{t("orders.todayOnlyHint", { date: todayLabel })}</p>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h3>{t("orders.byProvince")}</h3>
          <p className="panel-meta">
            {groupedByProvince.length === 1
              ? t("orders.rowOne", { n: groupedByProvince.length })
              : t("orders.rowMany", { n: groupedByProvince.length })}
          </p>
        </div>
        <DataTable
          showSearch
          searchValue={provinceSearchText}
          onSearchValueChange={setProvinceSearchText}
          onSearch={() => setAppliedProvinceSearch(provinceSearchText)}
          searchPlaceholder={t("orders.searchProvincesPlaceholder")}
          searchButtonLabel={t("common.search", { defaultValue: "Search" })}
          pagination={{
            page: provincePage,
            pageSize: provincePageSize,
            totalRows: filteredGroupedProvinces.length,
            onPageChange: setProvincePage,
            onPageSizeChange: setProvincePageSize,
          }}
        >
          <thead>
            <tr>
              <th>{t("orders.province")}</th>
              <th>{t("orders.qty")}</th>
              <th>{t("orders.actions", { defaultValue: "Actions" })}</th>
            </tr>
          </thead>
          <tbody>
            {pagedGroupedProvinces.map((row) => (
              <tr key={row.provinceKey}>
                <td>{row.provinceLabel}</td>
                <td>
                  <span className="qty-chip">{row.qty}</span>
                </td>
                <td>
                  <Button variant="sm" onClick={() => setActiveProvince(row)}>
                    {t("orders.view", { defaultValue: "View" })}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>

      {activeProvince ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="orders-province-view-title">
          <section className="panel modal-card modal-card--orders-truck modal-card--orders-pivot">
            <div className="panel-header">
              <h3 id="orders-province-view-title">
                {t("orders.provinceOrdersFor", {
                  defaultValue: "Orders for {{province}}",
                  province: activeProvince.provinceLabel,
                })}
              </h3>
              <Button variant="ghost" tone="cancel" onClick={() => setActiveProvince(null)}>
                {t("customers.cancel")}
              </Button>
            </div>
            <OrdersPivotTable
              itemColumns={pivotedProvince.itemColumns}
              pagedRows={pagedModalProvinceRows}
              allRows={pivotedProvince.rows}
              dash={dash}
              customerHeader={t("orders.customer")}
              totalLabel={t("orders.totalAll", { defaultValue: "Total" })}
              pagination={{
                page: modalProvinceOrderPage,
                pageSize: modalProvinceOrderPageSize,
                totalRows: pivotedProvince.rows.length,
                onPageChange: setModalProvinceOrderPage,
                onPageSizeChange: setModalProvinceOrderPageSize,
              }}
            />
          </section>
        </div>
      ) : null}
    </section>
  );
}
