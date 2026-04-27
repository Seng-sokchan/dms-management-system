import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PaymentsSection } from "../components/PaymentsSection";

export function PaymentsPage({
  user,
  orders,
  payments,
  paymentMethods,
  newPayment,
  setNewPayment,
  onSubmitPayment,
}) {
  const { t } = useTranslation();
  const [abaOrder, setAbaOrder] = useState(null);
  const isCustomerRole = user?.role === "Customer";
  const customerOrders = isCustomerRole ? orders : [];
  const totalDebt = customerOrders.reduce((sum, order) => {
    const remaining = Number(order.amountTotal || 0) - Number(order.amountPaid || 0);
    return sum + Math.max(0, remaining);
  }, 0);

  function handlePayWithAba(order) {
    setAbaOrder(order);
  }

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("payments.title")}</h2>
        <p className="section-lead">{isCustomerRole ? t("payments.customerLead") : t("payments.lead")}</p>
      </div>
      {isCustomerRole ? (
        <section className="panel customer-debt-panel">
          <div className="customer-debt-header">
            <h3>{t("payments.customerDebtTitle")}</h3>
            <span className="customer-debt-total">
              {t("payments.totalDebt")}: ${totalDebt.toFixed(2)}
            </span>
          </div>
          <p className="customer-debt-subtitle">
            {t("payments.totalDebt")}: ${totalDebt.toFixed(2)}
          </p>
          <div className="table-wrap">
            <table className="customer-debt-table">
              <thead>
                <tr>
                  <th>{t("orders.item")}</th>
                  <th>{t("orders.qty")}</th>
                  <th>{t("payments.debtAmount")}</th>
                  <th>{t("payments.action")}</th>
                </tr>
              </thead>
              <tbody>
                {customerOrders.map((order) => {
                  const total = Number(order.amountTotal || 0);
                  const paid = Number(order.amountPaid || 0);
                  const remaining = Math.max(0, total - paid);
                  return (
                    <tr key={order.id}>
                      <td>{order.itemName}</td>
                      <td>{order.orderedQty}</td>
                      <td>${remaining.toFixed(2)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handlePayWithAba(order)}
                          disabled={remaining <= 0}
                        >
                          {t("payments.payWithAba")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <PaymentsSection
          orders={orders}
          payments={payments}
          paymentMethods={paymentMethods}
          newPayment={newPayment}
          setNewPayment={setNewPayment}
          onSubmitPayment={onSubmitPayment}
        />
      )}
      {abaOrder ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="aba-modal-title">
          <div className="panel modal-card aba-modal-card">
            <div className="aba-modal-header">
              <h3 id="aba-modal-title">{t("payments.payWithAba")}</h3>
              <button type="button" className="btn-ghost" onClick={() => setAbaOrder(null)}>
                {t("payments.close")}
              </button>
            </div>
            <p className="aba-modal-subtitle">
              {t("payments.scanQrInstruction")}
            </p>
            <div className="aba-modal-body">
              <div className="aba-qr-sample" aria-label="Sample ABA QR code" />
              <div className="aba-order-info">
                <p className="aba-refresh-hint">{t("payments.refreshVerifyHint")}</p>
                <p><strong>{t("orders.item")}:</strong> {abaOrder.itemName}</p>
                <p><strong>{t("orders.qty")}:</strong> {abaOrder.orderedQty}</p>
                <p>
                  <strong>{t("payments.debtAmount")}:</strong> $
                  {Math.max(0, Number(abaOrder.amountTotal || 0) - Number(abaOrder.amountPaid || 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
