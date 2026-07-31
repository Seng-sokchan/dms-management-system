import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../../hooks/usePagination";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { OrdersPivotTable } from "./OrdersPivotTable";
import {
  filterOrdersCreatedToday,
  formatTodayLabel,
  getCustomerKey,
  pivotOrdersByCustomer,
} from "./ordersTodayUtils";
import "../OrdersPage.css";

export function OrdersByDepotPage({ orders = [], customers = [] }) {
  const { t } = useTranslation();
  const [activeDepot, setActiveDepot] = useState(null);
  const [depotSearchText, setDepotSearchText] = useState("");
  const [appliedDepotSearch, setAppliedDepotSearch] = useState("");

  const dash = t("orders.dash");
  const todayLabel = useMemo(() => formatTodayLabel(), []);
  const todayOrders = useMemo(() => filterOrdersCreatedToday(orders), [orders]);

  const customersById = useMemo(() => {
    const map = new Map();
    for (const customer of customers || []) {
      if (customer?.id == null) continue;
      map.set(String(customer.id), customer);
    }
    return map;
  }, [customers]);

  const groupedByDepot = useMemo(() => {
    const map = new Map();
    todayOrders.forEach((order) => {
      const customerId =
        order.customerId != null && String(order.customerId).trim() !== ""
          ? String(order.customerId)
          : "";
      const customer = customerId ? customersById.get(customerId) : null;
      const depotId =
        customer?.depotId != null && String(customer.depotId).trim() !== ""
          ? String(customer.depotId)
          : null;
      const key = depotId ?? "__unassigned__";
      if (!map.has(key)) {
        map.set(key, {
          depotKey: key,
          depotLabel:
            (customer?.depotName && String(customer.depotName).trim()) ||
            (key === "__unassigned__" ? t("orders.unassignedDepot") : dash),
          rows: [],
        });
      }
      const group = map.get(key);
      if (
        (!group.depotLabel || group.depotLabel === dash) &&
        customer?.depotName &&
        String(customer.depotName).trim()
      ) {
        group.depotLabel = String(customer.depotName).trim();
      }
      group.rows.push(order);
    });

    return Array.from(map.values())
      .map((group) => {
        const customerKeys = new Set(
          group.rows.map((order) => getCustomerKey(order, dash)),
        );
        const qty = group.rows.reduce((sum, row) => sum + Number(row.orderedQty || 0), 0);
        return {
          ...group,
          customerCount: customerKeys.size,
          qty,
        };
      })
      .sort((a, b) => a.depotLabel.localeCompare(b.depotLabel));
  }, [todayOrders, customersById, t, dash]);

  const filteredGroupedDepots = useMemo(() => {
    const keyword = appliedDepotSearch.trim().toLowerCase();
    if (!keyword) return groupedByDepot;
    return groupedByDepot.filter((row) =>
      [row.depotLabel, row.customerCount, row.qty]
        .filter((value) => value != null && value !== "")
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [groupedByDepot, appliedDepotSearch]);

  const {
    page: depotPage,
    pageSize: depotPageSize,
    paged: pagedGroupedDepots,
    setPage: setDepotPage,
    setPageSize: setDepotPageSize,
  } = usePagination(filteredGroupedDepots, { resetKey: appliedDepotSearch });

  const pivotedDepot = useMemo(
    () => pivotOrdersByCustomer(activeDepot?.rows ?? [], dash, customersById),
    [activeDepot?.rows, dash, customersById],
  );

  const {
    page: modalDepotOrderPage,
    pageSize: modalDepotOrderPageSize,
    paged: pagedModalDepotRows,
    setPage: setModalDepotOrderPage,
    setPageSize: setModalDepotOrderPageSize,
  } = usePagination(pivotedDepot.rows, { resetKey: activeDepot?.depotKey ?? "" });

  return (
    <section className="admin-page orders-page-panels">
      <div className="section-heading">
        <h2>{t("orders.byDepot")}</h2>
        <p className="section-lead">{t("orders.lead")}</p>
        <p className="form-hint">{t("orders.todayOnlyHint", { date: todayLabel })}</p>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h3>{t("orders.byDepot")}</h3>
          <p className="panel-meta">
            {groupedByDepot.length === 1
              ? t("orders.rowOne", { n: groupedByDepot.length })
              : t("orders.rowMany", { n: groupedByDepot.length })}
          </p>
        </div>
        <DataTable
          showSearch
          searchValue={depotSearchText}
          onSearchValueChange={setDepotSearchText}
          onSearch={() => setAppliedDepotSearch(depotSearchText)}
          searchPlaceholder={t("orders.searchDepotsPlaceholder")}
          searchButtonLabel={t("common.search", { defaultValue: "Search" })}
          pagination={{
            page: depotPage,
            pageSize: depotPageSize,
            totalRows: filteredGroupedDepots.length,
            onPageChange: setDepotPage,
            onPageSizeChange: setDepotPageSize,
          }}
        >
          <thead>
            <tr>
              <th>{t("orders.depot")}</th>
              <th>{t("orders.customers")}</th>
              <th>{t("orders.qty")}</th>
              <th>{t("orders.actions", { defaultValue: "Actions" })}</th>
            </tr>
          </thead>
          <tbody>
            {pagedGroupedDepots.map((row) => (
              <tr key={row.depotKey}>
                <td>{row.depotLabel}</td>
                <td>
                  <span className="qty-chip">{row.customerCount}</span>
                </td>
                <td>
                  <span className="qty-chip">{row.qty}</span>
                </td>
                <td>
                  <Button variant="sm" onClick={() => setActiveDepot(row)}>
                    {t("orders.view", { defaultValue: "View" })}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>

      {activeDepot ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="orders-depot-view-title"
        >
          <section className="panel modal-card modal-card--orders-truck modal-card--orders-pivot">
            <div className="panel-header">
              <h3 id="orders-depot-view-title">
                {t("orders.depotOrdersFor", {
                  depot: activeDepot.depotLabel,
                })}
              </h3>
              <Button variant="ghost" tone="cancel" onClick={() => setActiveDepot(null)}>
                {t("customers.cancel")}
              </Button>
            </div>
            <p className="form-hint">
              {t("orders.depotCustomerCount", {
                count: activeDepot.customerCount,
              })}
            </p>
            <OrdersPivotTable
              itemColumns={pivotedDepot.itemColumns}
              pagedRows={pagedModalDepotRows}
              allRows={pivotedDepot.rows}
              dash={dash}
              customerHeader={t("orders.customer")}
              totalLabel={t("orders.totalAll", { defaultValue: "Total" })}
              pagination={{
                page: modalDepotOrderPage,
                pageSize: modalDepotOrderPageSize,
                totalRows: pivotedDepot.rows.length,
                onPageChange: setModalDepotOrderPage,
                onPageSizeChange: setModalDepotOrderPageSize,
              }}
            />
          </section>
        </div>
      ) : null}
    </section>
  );
}
