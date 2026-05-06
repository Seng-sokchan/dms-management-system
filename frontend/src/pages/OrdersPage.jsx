import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../hooks/usePagination";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import "./OrdersPage.css";

function getGroupAddress(order) {
  return order.orderGroupName || "";
}

function getTruckLabel(order) {
  return order.truckCode
    ? `${order.truckCode}${order.truckPlateNo ? ` (${order.truckPlateNo})` : ""}`
    : "";
}

export function OrdersPage({ orders }) {
  const { t } = useTranslation();
  const [activeGroup, setActiveGroup] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const groupedOrders = useMemo(() => {
    const map = new Map();
    (orders || []).forEach((order) => {
      const key = getGroupAddress(order) || t("orders.dash");
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(order);
    });
    return Array.from(map.entries()).map(([groupAddress, rows]) => {
      const truckNames = Array.from(
        new Set(rows.map(getTruckLabel).filter(Boolean)),
      );
      const statuses = Array.from(new Set(rows.map((row) => row.status).filter(Boolean)));
      const qty = rows.reduce((sum, row) => sum + Number(row.orderedQty || 0), 0);
      return {
        groupAddress,
        rows,
        qty,
        truckLabel: truckNames.length ? truckNames.join(", ") : t("orders.dash"),
        statusLabel: statuses.length === 1 ? statuses[0] : t("orders.mixedStatus", { defaultValue: "MIXED" }),
      };
    });
  }, [orders, t]);
  const filteredGroupedOrders = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return groupedOrders;
    return groupedOrders.filter((group) =>
      [group.groupAddress, group.truckLabel, group.qty, group.statusLabel]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [groupedOrders, appliedSearch]);
  const {
    page: groupPage,
    pageSize: groupPageSize,
    paged: pagedGroupedOrders,
    setPage: setGroupPage,
    setPageSize: setGroupPageSize,
  } = usePagination(filteredGroupedOrders, { resetKey: appliedSearch });
  const orderModalRows = activeGroup?.rows ?? [];
  const {
    page: modalOrderPage,
    pageSize: modalOrderPageSize,
    paged: pagedModalOrders,
    setPage: setModalOrderPage,
    setPageSize: setModalOrderPageSize,
  } = usePagination(orderModalRows, { resetKey: activeGroup?.groupAddress ?? "" });

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("orders.title")}</h2>
        <p className="section-lead">{t("orders.lead")}</p>
      </div>
      <section className="panel">
        <div className="panel-header">
          <h3>{t("orders.allOrders")}</h3>
          <p className="panel-meta">
            {groupedOrders.length === 1
              ? t("orders.rowOne", { n: groupedOrders.length })
              : t("orders.rowMany", { n: groupedOrders.length })}
          </p>
        </div>
        <DataTable
          showSearch
          searchValue={searchText}
          onSearchValueChange={setSearchText}
          onSearch={() => setAppliedSearch(searchText)}
          searchPlaceholder={t("orders.searchPlaceholder", { defaultValue: "Search grouped orders..." })}
          searchButtonLabel={t("common.search", { defaultValue: "Search" })}
          pagination={{
            page: groupPage,
            pageSize: groupPageSize,
            totalRows: filteredGroupedOrders.length,
            onPageChange: setGroupPage,
            onPageSizeChange: setGroupPageSize,
          }}
        >
            <thead>
              <tr>
                <th>{t("orders.groupMainAddress", { defaultValue: "Group main address" })}</th>
                <th>{t("orders.truck")}</th>
                <th>{t("orders.qty")}</th>
                <th>{t("orders.status")}</th>
                <th>{t("orders.actions", { defaultValue: "Actions" })}</th>
              </tr>
            </thead>
            <tbody>
              {pagedGroupedOrders.map((group) => (
                <tr key={group.groupAddress}>
                  <td>{group.groupAddress}</td>
                  <td>{group.truckLabel}</td>
                  <td>
                    <span className="qty-chip">{group.qty}</span>
                  </td>
                  <td>
                    <span className="status-chip">{group.statusLabel}</span>
                  </td>
                  <td>
                    <Button variant="sm" onClick={() => setActiveGroup(group)}>
                      {t("orders.view", { defaultValue: "View" })}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
        </DataTable>
      </section>
      {activeGroup ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="orders-group-view-title">
          <section className="panel modal-card modal-card--orders-group">
            <div className="panel-header">
              <h3 id="orders-group-view-title">
                {t("orders.groupOrdersFor", {
                  defaultValue: "Orders for {{group}}",
                  group: activeGroup.groupAddress,
                })}
              </h3>
              <Button variant="ghost" tone="cancel" onClick={() => setActiveGroup(null)}>
                {t("customers.cancel")}
              </Button>
            </div>
            <DataTable
              pagination={{
                page: modalOrderPage,
                pageSize: modalOrderPageSize,
                totalRows: orderModalRows.length,
                onPageChange: setModalOrderPage,
                onPageSizeChange: setModalOrderPageSize,
              }}
            >
                <thead>
                  <tr>
                    <th>{t("orders.customer")}</th>
                    <th>{t("orders.item")}</th>
                    <th>{t("orders.truck")}</th>
                    <th>{t("orders.qty")}</th>
                    <th>{t("orders.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedModalOrders.map((row) => (
                    <tr key={row.id}>
                      <td>{row.customerName || t("orders.dash")}</td>
                      <td>
                        {row.itemName
                          ? `#${row.id} - ${row.itemName}`
                          : `#${row.id} - ${t("orders.dash")}`}
                      </td>
                      <td>{getTruckLabel(row) || t("orders.dash")}</td>
                      <td>{row.orderedQty}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
            </DataTable>
          </section>
        </div>
      ) : null}
    </section>
  );
}
