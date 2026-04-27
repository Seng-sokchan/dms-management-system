import { useTranslation } from "react-i18next";

export function PaymentsSection({
  orders,
  payments,
  paymentMethods,
  newPayment,
  setNewPayment,
  onSubmitPayment,
}) {
  const { t } = useTranslation();
  return (
    <section className="pay-grid">
      <form className="panel form" onSubmit={onSubmitPayment}>
        <h3>{t("payments.recordTitle")}</h3>
        <label className="form-label" htmlFor="payment-order-id">
          {t("payments.selectOrder")}
        </label>
        <select
          id="payment-order-id"
          value={newPayment.orderId}
          onChange={(event) => setNewPayment({ ...newPayment, orderId: event.target.value })}
          required
        >
          <option value="">{t("payments.selectOrder")}</option>
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.customerName} - {order.itemName}
            </option>
          ))}
        </select>
        <label className="form-label" htmlFor="payment-amount">
          {t("payments.amount")}
        </label>
        <input
          id="payment-amount"
          type="number"
          value={newPayment.amount}
          onChange={(event) => setNewPayment({ ...newPayment, amount: event.target.value })}
          min="1"
        />
        <label className="form-label" htmlFor="payment-method">
          {t("payments.method")}
        </label>
        <select
          id="payment-method"
          value={newPayment.method}
          onChange={(event) => setNewPayment({ ...newPayment, method: event.target.value })}
          required
        >
          <option value="">{t("payments.selectMethod")}</option>
          {paymentMethods.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <label className="form-label" htmlFor="payment-note">
          {t("payments.notePh")}
        </label>
        <input
          id="payment-note"
          value={newPayment.note}
          onChange={(event) => setNewPayment({ ...newPayment, note: event.target.value })}
          placeholder={t("payments.notePh")}
        />
        <button type="submit" className="btn-primary">
          {t("payments.save")}
        </button>
      </form>

      <article className="panel">
        <h3>{t("payments.history")}</h3>
        <ul className="pay-list">
          {payments.map((payment) => {
            const label = [payment.orderCustomerName, payment.orderItemName].filter(Boolean).join(" · ");
            return (
              <li key={payment.id}>
                {label ? <span className="pay-order-label">{label}</span> : null}
                {label ? " — " : null}
                ${payment.amount} ({payment.methodName ?? payment.method})
              </li>
            );
          })}
        </ul>
      </article>
    </section>
  );
}

