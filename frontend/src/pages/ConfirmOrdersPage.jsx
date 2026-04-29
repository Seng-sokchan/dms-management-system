import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { OrdersTable } from "../features/order/OrdersTable";
import { useConfirm } from "../components/ui/ConfirmProvider";

export function ConfirmOrdersPage({ orders, statuses, onUpdateStatus, onConfirmDelivery }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();

  async function handleSupplierReady(orderId) {
    if (
      !(await confirm({
        title: t("confirm.supplierReadyTitle"),
        message: t("confirm.supplierReadyMessage"),
        tone: "primary",
      }))
    ) {
      return;
    }
    onUpdateStatus(orderId, "SUPPLIER_ORDER_READY");
  }

  const logisticsOrders = useMemo(
    () => (orders || []).filter((row) => row.status === "SENT_TO_LOGISTICS_SUPPLIER"),
    [orders],
  );

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("confirmOrders.title", { defaultValue: "Confirm Orders" })}</h2>
        <p className="section-lead">
          {t("confirmOrders.lead", {
            defaultValue: "Logistics confirms customer order delivery and updates delivery status.",
          })}
        </p>
      </div>
      <OrdersTable
        orders={logisticsOrders}
        statuses={statuses}
        onUpdateStatus={onUpdateStatus}
        onConfirmDelivery={onConfirmDelivery}
        readOnly
        renderActions={(order) => (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn-sm"
              onClick={() => void handleSupplierReady(order.id)}
            >
              SUPPLIER READY
            </button>
          </div>
        )}
      />
    </section>
  );
}
