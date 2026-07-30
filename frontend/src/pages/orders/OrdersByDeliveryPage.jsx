import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../../hooks/usePagination";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { OrdersPivotTable } from "./OrdersPivotTable";
import {
  buildAgentLookup,
  copyTextToClipboard,
  filterOrdersCreatedToday,
  formatTodayLabel,
  formatTruckCopyText,
  pivotOrdersByCustomer,
} from "./ordersTodayUtils";
import "../OrdersPage.css";

export function OrdersByDeliveryPage({ orders, deliveryAgents = [] }) {
  const { t, i18n } = useTranslation();
  const [activeTruck, setActiveTruck] = useState(null);
  const [truckSearchText, setTruckSearchText] = useState("");
  const [appliedTruckSearch, setAppliedTruckSearch] = useState("");
  const [copiedTruckKey, setCopiedTruckKey] = useState(null);

  const agentById = useMemo(() => buildAgentLookup(deliveryAgents), [deliveryAgents]);
  const dash = t("orders.dash");
  const todayLabel = useMemo(() => formatTodayLabel(), []);
  const todayOrders = useMemo(() => filterOrdersCreatedToday(orders), [orders]);

  const groupedByTruck = useMemo(() => {
    const map = new Map();
    todayOrders.forEach((order) => {
      const id =
        order.deliveryAgentId != null && String(order.deliveryAgentId).trim() !== ""
          ? String(order.deliveryAgentId)
          : null;
      const key = id ?? "__unassigned__";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(order);
    });
    return Array.from(map.entries()).map(([truckKey, rows]) => {
      const agent = truckKey !== "__unassigned__" ? agentById.get(truckKey) : null;
      const nameFromOrder = rows.find((r) => r.deliveryAgentName)?.deliveryAgentName;
      const truckLabel =
        agent?.name ||
        nameFromOrder ||
        (truckKey === "__unassigned__" ? t("orders.unassignedTruck") : t("orders.dash"));
      const vehicleType = agent?.vehicleType?.trim() || t("orders.dash");
      const statuses = Array.from(new Set(rows.map((row) => row.status).filter(Boolean)));
      const qty = rows.reduce((sum, row) => sum + Number(row.orderedQty || 0), 0);
      return {
        truckKey,
        truckLabel,
        vehicleType,
        rows,
        qty,
        statusLabel: statuses.length === 1 ? statuses[0] : t("orders.mixedStatus", { defaultValue: "MIXED" }),
      };
    });
  }, [todayOrders, agentById, t]);

  const filteredGroupedTrucks = useMemo(() => {
    const keyword = appliedTruckSearch.trim().toLowerCase();
    if (!keyword) return groupedByTruck;
    return groupedByTruck.filter((row) =>
      [row.truckLabel, row.vehicleType, row.qty, row.statusLabel]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [groupedByTruck, appliedTruckSearch]);

  const {
    page: truckPage,
    pageSize: truckPageSize,
    paged: pagedGroupedTrucks,
    setPage: setTruckPage,
    setPageSize: setTruckPageSize,
  } = usePagination(filteredGroupedTrucks, { resetKey: appliedTruckSearch });

  const pivotedTruck = useMemo(
    () => pivotOrdersByCustomer(activeTruck?.rows ?? [], dash),
    [activeTruck?.rows, dash],
  );

  const {
    page: modalTruckOrderPage,
    pageSize: modalTruckOrderPageSize,
    paged: pagedModalTruckRows,
    setPage: setModalTruckOrderPage,
    setPageSize: setModalTruckOrderPageSize,
  } = usePagination(pivotedTruck.rows, { resetKey: activeTruck?.truckKey ?? "" });

  async function handleCopyTruck(row) {
    const text = formatTruckCopyText(
      row,
      dash,
      i18n.language,
      t("orders.copyTotalAmount"),
    );
    try {
      await copyTextToClipboard(text);
      setCopiedTruckKey(row.truckKey);
      window.setTimeout(() => setCopiedTruckKey((k) => (k === row.truckKey ? null : k)), 2000);
    } catch {
      setCopiedTruckKey(null);
    }
  }

  return (
    <section className="admin-page orders-page-panels">
      <div className="section-heading">
        <h2>{t("orders.byDelivery")}</h2>
        <p className="section-lead">{t("orders.lead")}</p>
        <p className="form-hint">{t("orders.todayOnlyHint", { date: todayLabel })}</p>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h3>{t("orders.byDelivery")}</h3>
          <p className="panel-meta">
            {groupedByTruck.length === 1
              ? t("orders.rowOne", { n: groupedByTruck.length })
              : t("orders.rowMany", { n: groupedByTruck.length })}
          </p>
        </div>
        <DataTable
          showSearch
          searchValue={truckSearchText}
          onSearchValueChange={setTruckSearchText}
          onSearch={() => setAppliedTruckSearch(truckSearchText)}
          searchPlaceholder={t("orders.searchTrucksPlaceholder")}
          searchButtonLabel={t("common.search", { defaultValue: "Search" })}
          pagination={{
            page: truckPage,
            pageSize: truckPageSize,
            totalRows: filteredGroupedTrucks.length,
            onPageChange: setTruckPage,
            onPageSizeChange: setTruckPageSize,
          }}
        >
          <thead>
            <tr>
              <th>{t("orders.driverOrAgent")}</th>
              <th>{t("orders.vehicleType")}</th>
              <th>{t("orders.qty")}</th>
              <th>{t("orders.status")}</th>
              <th>{t("orders.actions", { defaultValue: "Actions" })}</th>
            </tr>
          </thead>
          <tbody>
            {pagedGroupedTrucks.map((row) => (
              <tr key={row.truckKey}>
                <td>{row.truckLabel}</td>
                <td>{row.vehicleType}</td>
                <td>
                  <span className="qty-chip">{row.qty}</span>
                </td>
                <td>
                  <span className="status-chip">{row.statusLabel}</span>
                </td>
                <td>
                  <div className="orders-truck-actions">
                    <Button variant="sm" onClick={() => setActiveTruck(row)}>
                      {t("orders.view", { defaultValue: "View" })}
                    </Button>
                    <Button variant="sm" onClick={() => void handleCopyTruck(row)}>
                      {copiedTruckKey === row.truckKey
                        ? t("orders.copyTruckDone")
                        : t("orders.copyTruck")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>

      {activeTruck ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="orders-truck-view-title">
          <section className="panel modal-card modal-card--orders-truck modal-card--orders-pivot">
            <div className="panel-header">
              <h3 id="orders-truck-view-title">
                {t("orders.truckOrdersFor", {
                  defaultValue: "Orders for {{truck}}",
                  truck: activeTruck.truckLabel,
                })}
              </h3>
              <Button variant="ghost" tone="cancel" onClick={() => setActiveTruck(null)}>
                {t("customers.cancel")}
              </Button>
            </div>
            <OrdersPivotTable
              itemColumns={pivotedTruck.itemColumns}
              pagedRows={pagedModalTruckRows}
              allRows={pivotedTruck.rows}
              dash={dash}
              customerHeader={t("orders.customer")}
              totalLabel={t("orders.totalAll", { defaultValue: "Total" })}
              pagination={{
                page: modalTruckOrderPage,
                pageSize: modalTruckOrderPageSize,
                totalRows: pivotedTruck.rows.length,
                onPageChange: setModalTruckOrderPage,
                onPageSizeChange: setModalTruckOrderPageSize,
              }}
            />
          </section>
        </div>
      ) : null}
    </section>
  );
}
