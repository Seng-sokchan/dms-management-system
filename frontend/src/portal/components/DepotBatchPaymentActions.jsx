import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

function resolveBatchPaymentState(orders) {
  const statuses = (orders || []).map((order) => order?.paymentStatus || "unpaid");
  if (!statuses.length) {
    return { badge: "unpaid", canPay: false, mixed: false };
  }
  const allPaid = statuses.every((status) => status === "paid");
  const allUnpaid = statuses.every((status) => status === "unpaid");

  if (allPaid) {
    return { badge: "paid", canPay: false, mixed: false };
  }
  if (allUnpaid) {
    return { badge: "unpaid", canPay: true, mixed: false };
  }
  return { badge: "mixed", canPay: false, mixed: true };
}

/**
 * Payment badge + Pay batch CTA (mirrors mobile DepotBatchPaymentActions).
 */
export function DepotBatchPaymentActions({
  masterOrderId,
  orders,
  i18nPrefix = "portal.depot",
}) {
  const { t } = useTranslation();
  const paymentState = useMemo(() => resolveBatchPaymentState(orders), [orders]);
  const isPaid = paymentState.badge === "paid";
  const showActionsBelowBadge = paymentState.canPay || paymentState.mixed;

  const badgeLabel =
    paymentState.badge === "mixed"
      ? t(`${i18nPrefix}.batchPaymentMixed`)
      : t(`portal.payment.status.${paymentState.badge}`, paymentState.badge);

  return (
    <div className="portal-batch-pay">
      <div
        className={`portal-batch-pay__badge-row${
          showActionsBelowBadge ? " portal-batch-pay__badge-row--spaced" : ""
        }`}
      >
        <span
          className={`portal-status${isPaid ? " portal-status--paid" : ""}${
            paymentState.mixed ? " portal-status--mixed" : ""
          }`}
        >
          {badgeLabel}
        </span>
      </div>
      {paymentState.mixed ? (
        <p className="portal-batch-pay__hint">{t(`${i18nPrefix}.batchPaymentMixedHint`)}</p>
      ) : null}
      {paymentState.canPay ? (
        <Link
          to={`/portal/pay-batch/${masterOrderId}`}
          state={{ orders }}
          className="portal-btn portal-btn--primary portal-btn--block"
        >
          {t(`${i18nPrefix}.payBatch`)}
        </Link>
      ) : null}
    </div>
  );
}
