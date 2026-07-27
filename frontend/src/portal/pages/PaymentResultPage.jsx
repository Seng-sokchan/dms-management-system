import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPayment } from "../services/payments";
import { portalHomePath } from "../constants/menus";
import { PortalButton } from "../components/PortalButton";
import { SectionHeader } from "../components/SectionHeader";

export function PaymentResultPage({ token, user }) {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState("paid");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !paymentId) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    getPayment(token, paymentId)
      .then((row) => {
        if (!cancelled) setStatus(row?.status || "paid");
      })
      .catch(() => {
        if (!cancelled) setStatus("paid");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paymentId, token]);

  const ordersPath = user?.role === "Depot" ? "/portal/depot-orders" : "/portal/orders";

  return (
    <div>
      <SectionHeader title={t("portal.payment.resultTitle")} />
      {loading ? (
        <p className="portal-empty">{t("portal.common.loading")}</p>
      ) : (
        <article className="portal-card">
          <h3>
            {status === "paid"
              ? t("portal.payment.completedTitle")
              : t("portal.payment.result.unpaid")}
          </h3>
          <p className="portal-card-meta">
            {status === "paid"
              ? t("portal.payment.completedSubtitle")
              : t("portal.payment.resultPendingHint")}
          </p>
          <div className="portal-actions">
            <PortalButton block onClick={() => navigate(ordersPath)}>
              {t("portal.payment.backToOrders")}
            </PortalButton>
            <PortalButton tone="soft" block onClick={() => navigate(portalHomePath(user))}>
              {t("portal.payment.continueShopping")}
            </PortalButton>
          </div>
        </article>
      )}
    </div>
  );
}
