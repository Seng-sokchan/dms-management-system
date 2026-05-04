import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";

export function OrderMovementPage({ orders = [], statuses = [], onMoveStatus }) {
  const { t } = useTranslation();
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState("");
  const selectedOrder = orders.find((row) => String(row.id) === String(orderId));

  async function submit(event) {
    event.preventDefault();
    if (!orderId || !status) return;
    await onMoveStatus(orderId, status);
  }

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("orderMovement.title", { defaultValue: "Order Movement" })}</h2>
        <p className="section-lead">
          {t("orderMovement.lead", { defaultValue: "Move order status forward or backward." })}
        </p>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h3>{t("orderMovement.formTitle", { defaultValue: "Move order status" })}</h3>
        </div>
        <form className="grid-form" onSubmit={submit}>
          <label>
            {t("orderMovement.order", { defaultValue: "Order" })}
            <select value={orderId} onChange={(event) => setOrderId(event.target.value)} required>
              <option value="">{t("orderMovement.selectOrder", { defaultValue: "— Select order —" })}</option>
              {orders.map((row) => (
                <option key={row.id} value={row.id}>
                  #{row.id} · {row.customerName || "—"} · {row.status}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t("orderMovement.status", { defaultValue: "Target status" })}
            <select value={status} onChange={(event) => setStatus(event.target.value)} required>
              <option value="">{t("orderMovement.selectStatus", { defaultValue: "— Select status —" })}</option>
              {statuses.map((item) => (
                <option key={item.name || item.id} value={item.name || item}>
                  {item.name || item}
                </option>
              ))}
            </select>
          </label>

          {selectedOrder ? (
            <p className="form-hint">
              {t("orderMovement.currentStatus", { defaultValue: "Current status: {{status}}", status: selectedOrder.status })}
            </p>
          ) : null}

          <Button variant="primary" type="submit">
            {t("orderMovement.move", { defaultValue: "Move status" })}
          </Button>
        </form>
      </section>
    </section>
  );
}
