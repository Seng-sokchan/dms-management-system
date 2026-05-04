import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "../components/ui/DataTable";
import "./AssignOrdersPage.css";

function currentTruckLabel(order, t) {
  if (order.truckCode) {
    return `${order.truckCode}${order.truckPlateNo ? ` (${order.truckPlateNo})` : ""}`;
  }
  return t("orders.dash");
}

export function AssignOrdersPage({ orders = [], trucks = [], orderGroups = [], onAssignTruck, onAssignOrderGroup }) {
  const { t } = useTranslation();
  const [busyTruckId, setBusyTruckId] = useState(null);
  const [busyGroupId, setBusyGroupId] = useState(null);

  const sortedOrders = useMemo(
    () => [...(orders || [])].sort((a, b) => Number(b.id) - Number(a.id)),
    [orders],
  );

  async function handleTruckChange(order, truckId) {
    const next = truckId || null;
    const cur = order.truckId != null && order.truckId !== "" ? String(order.truckId) : "";
    if ((next || "") === cur) return;
    if (!next) return;
    setBusyTruckId(order.id);
    try {
      await onAssignTruck(order.id, next);
    } finally {
      setBusyTruckId(null);
    }
  }

  async function handleGroupChange(order, orderGroupId) {
    const next = orderGroupId || null;
    const cur = order.orderGroupId != null && order.orderGroupId !== "" ? String(order.orderGroupId) : "";
    if ((next || "") === cur) return;
    if (!next) return;
    setBusyGroupId(order.id);
    try {
      await onAssignOrderGroup(order.id, next);
    } finally {
      setBusyGroupId(null);
    }
  }

  const rowMeta =
    sortedOrders.length === 1
      ? t("orders.rowOne", { n: sortedOrders.length })
      : t("orders.rowMany", { n: sortedOrders.length });

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("assignOrders.title")}</h2>
        <p className="section-lead">{t("assignOrders.lead")}</p>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h3>{t("assignOrders.truckPanelTitle")}</h3>
          <p className="panel-meta">{rowMeta}</p>
        </div>
        <p className="form-hint">{t("assignOrders.truckPanelHint")}</p>
        <DataTable>
            <thead>
              <tr>
                <th>{t("orders.customer")}</th>
                <th>{t("orders.item")}</th>
                <th>{t("orders.status")}</th>
                <th>{t("assignOrders.currentTruck")}</th>
                <th>{t("assignOrders.assignTruck")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order) => (
                <tr key={`truck-${order.id}`}>
                  <td>{order.customerName || t("orders.dash")}</td>
                  <td>{order.itemName ? `#${order.id} · ${order.itemName}` : `#${order.id}`}</td>
                  <td>
                    <span className="status-chip">{order.status}</span>
                  </td>
                  <td>{currentTruckLabel(order, t)}</td>
                  <td>
                    <select
                      aria-label={t("assignOrders.assignTruck")}
                      value={order.truckId != null && order.truckId !== "" ? String(order.truckId) : ""}
                      disabled={busyTruckId === order.id}
                      onChange={(event) => void handleTruckChange(order, event.target.value)}
                    >
                      <option value="">{t("assignOrders.selectTruckPlaceholder")}</option>
                      {trucks.map((truck) => (
                        <option key={truck.id} value={truck.id}>
                          {truck.code}
                          {truck.plateNo ? ` (${truck.plateNo})` : ""}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
        </DataTable>

        <h3 className="assign-orders-subpanel-title">{t("assignOrders.groupPanelTitle")}</h3>
        <p className="form-hint">{t("assignOrders.groupPanelHint")}</p>
        <DataTable>
            <thead>
              <tr>
                <th>{t("orders.customer")}</th>
                <th>{t("orders.item")}</th>
                <th>{t("orders.status")}</th>
                <th>{t("assignOrders.currentGroup")}</th>
                <th>{t("assignOrders.assignGroup")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order) => (
                <tr key={`group-${order.id}`}>
                  <td>{order.customerName || t("orders.dash")}</td>
                  <td>{order.itemName ? `#${order.id} · ${order.itemName}` : `#${order.id}`}</td>
                  <td>
                    <span className="status-chip">{order.status}</span>
                  </td>
                  <td>{order.orderGroupName || t("orders.dash")}</td>
                  <td>
                    <select
                      aria-label={t("assignOrders.assignGroup")}
                      value={order.orderGroupId != null && order.orderGroupId !== "" ? String(order.orderGroupId) : ""}
                      disabled={busyGroupId === order.id}
                      onChange={(event) => void handleGroupChange(order, event.target.value)}
                    >
                      <option value="">{t("assignOrders.selectGroupPlaceholder")}</option>
                      {orderGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
        </DataTable>
      </section>
    </section>
  );
}
