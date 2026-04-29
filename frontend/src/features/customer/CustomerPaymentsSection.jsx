import { useState } from "react";
import { useTranslation } from "react-i18next";

export function CustomerPaymentsSection({ orders, onPayWithAba }) {
  const { t } = useTranslation();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const totalItems = orders.length;
  const totalDebt = orders.reduce((sum, order) => {
    const remaining = Number(order.amountTotal || 0) - Number(order.amountPaid || 0);
    return sum + Math.max(0, remaining);
  }, 0);
  const totalPaid = orders.reduce((sum, order) => sum + Number(order.amountPaid || 0), 0);
  const totalQty = orders.reduce((sum, order) => sum + Number(order.orderedQty || 0), 0);
  const totalAmount = orders.reduce((sum, order) => sum + Number(order.amountTotal || 0), 0);

  return (
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

      <div className="customer-payment-list">
        <article className="customer-payment-card">
          <h4 className="customer-payment-item">{t("payments.customerDebtTitle")}</h4>
          <p><strong>{t("payments.totalItems", { defaultValue: "Total items" })}:</strong> {totalItems}</p>
          <p><strong>{t("payments.totalQty", { defaultValue: "Total qty" })}:</strong> {totalQty}</p>
          <p><strong>{t("payments.totalAmount")}:</strong> ${totalAmount.toFixed(2)}</p>
          <p><strong>{t("payments.paidAmount")}:</strong> ${totalPaid.toFixed(2)}</p>
          <p><strong>{t("payments.amount")}:</strong> ${totalDebt.toFixed(2)}</p>
          <div className="customer-payment-actions">
            <button
              type="button"
              className="btn-ghost customer-payment-view-btn"
              onClick={() => setSelectedOrder({ mode: "all" })}
            >
              {t("payments.viewButton", { defaultValue: "View" })}
            </button>
            <button
              type="button"
              className="btn-primary customer-payment-btn"
              onClick={() => onPayWithAba({ mode: "all", amount: totalDebt })}
              disabled={totalDebt <= 0}
            >
              {t("payments.payWithAba")}
            </button>
          </div>
        </article>
      </div>
      {selectedOrder ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="payment-detail-title">
          <div className="panel modal-card payment-detail-modal">
            <div className="aba-modal-header">
              <h3 id="payment-detail-title">{t("payments.detailTitle", { defaultValue: "Payment Detail" })}</h3>
              <button type="button" className="btn-ghost" onClick={() => setSelectedOrder(null)}>
                {t("payments.close")}
              </button>
            </div>
            <div className="table-wrap payment-detail-table-wrap">
              <table className="payment-detail-table">
                <thead>
                  <tr>
                    <th>{t("orders.item")}</th>
                    <th>{t("orders.qty")}</th>
                    <th>{t("payments.totalAmount")}</th>
                    <th>{t("payments.paidAmount")}</th>
                    <th>{t("payments.remainingAmount")}</th>
                    <th>{t("payments.action", { defaultValue: "Action" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((row) => (
                    <tr key={row.id}>
                      <td>{row.itemName}</td>
                      <td>{row.orderedQty}</td>
                      <td>${Number(row.amountTotal || 0).toFixed(2)}</td>
                      <td>${Number(row.amountPaid || 0).toFixed(2)}</td>
                      <td>${Math.max(0, Number(row.amountTotal || 0) - Number(row.amountPaid || 0)).toFixed(2)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => onPayWithAba(row)}
                          disabled={Math.max(0, Number(row.amountTotal || 0) - Number(row.amountPaid || 0)) <= 0}
                        >
                          {t("payments.payWithAba")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
