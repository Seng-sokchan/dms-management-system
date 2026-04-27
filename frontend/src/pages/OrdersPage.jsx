import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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
        <div className="table-wrap">
          <table className="data-table">
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
              {groupedOrders.map((group) => (
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
                    <button type="button" className="btn-sm" onClick={() => setActiveGroup(group)}>
                      {t("orders.view", { defaultValue: "View" })}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              <button type="button" className="btn-ghost btn-cancel" onClick={() => setActiveGroup(null)}>
                {t("customers.cancel")}
              </button>
            </div>
            <div className="table-wrap">
              <table className="data-table">
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
                  {activeGroup.rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.customerName || t("orders.dash")}</td>
                      <td>{row.itemName || t("orders.dash")}</td>
                      <td>{getTruckLabel(row) || t("orders.dash")}</td>
                      <td>{row.orderedQty}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
