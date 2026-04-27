import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../components/ConfirmProvider";

export function CustomerOrdersPage({ orders = [], onDeleteOrder, onConfirmOrder }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const newOrders = useMemo(() => (orders || []).filter((row) => row.status === "NEW_ORDER"), [orders]);

  async function handleDelete(orderId) {
    const ok = await confirm({
      title: t("confirm.deleteTitle"),
      message: t("customerOrders.confirmDelete", { defaultValue: "Delete this NEW_ORDER record?" }),
      tone: "danger",
    });
    if (!ok) return;
    await onDeleteOrder(orderId);
  }

  async function handleConfirm(orderId) {
    const ok = await confirm({
      title: t("customerOrders.confirmActionTitle", { defaultValue: "Confirm order" }),
      message: t("customerOrders.confirmActionMessage", {
        defaultValue: "Move this order from NEW_ORDER to OWNER_PREPARING?",
      }),
      tone: "primary",
    });
    if (!ok) return;
    await onConfirmOrder(orderId);
  }

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("customerOrders.title", { defaultValue: "Customer Orders" })}</h2>
        <p className="section-lead">
          {t("customerOrders.lead", {
            defaultValue: "Manage orders currently in NEW_ORDER status.",
          })}
        </p>
      </div>

      <section className="panel entity-list">
        <h3>{t("customerOrders.listTitle", { defaultValue: "NEW_ORDER list" })}</h3>
        {newOrders.length === 0 ? (
          <p className="entity-list-empty">{t("customerOrders.empty", { defaultValue: "No NEW_ORDER found." })}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("orders.customer")}</th>
                  <th>{t("orders.item")}</th>
                  <th>{t("orders.qty")}</th>
                  <th>{t("orders.status")}</th>
                  <th>{t("orders.actions", { defaultValue: "Actions" })}</th>
                </tr>
              </thead>
              <tbody>
                {newOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.customerName || t("orders.dash")}</td>
                    <td>{order.itemName || t("orders.dash")}</td>
                    <td>{order.orderedQty}</td>
                    <td>
                      <span className="status-chip">{order.status}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn-sm" onClick={() => void handleConfirm(order.id)}>
                          {t("customerOrders.confirmBtn", { defaultValue: "Confirm" })}
                        </button>
                        <button type="button" className="btn-ghost btn-delete" onClick={() => void handleDelete(order.id)}>
                          {t("customerOrders.deleteBtn", { defaultValue: "Delete" })}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

