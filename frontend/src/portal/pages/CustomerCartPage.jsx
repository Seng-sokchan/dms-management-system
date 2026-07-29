import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCart } from "../context/CartContext";
import { useOrderPlacementGate } from "../hooks/useOrderPlacementGate";
import { useConfirm } from "../../components/ui/ConfirmProvider";
import { getApiErrorMessage } from "../../services/apiClient";
import { preOrderCart } from "../services/orders";
import { PortalButton } from "../components/PortalButton";
import "./CustomerCartPage.css";

export function CustomerCartPage({ token, user }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { alert, confirm } = useConfirm();
  const { items, totalItems, updateQuantity, removeItem, clearCart } = useCart();
  const { orderWindowClosed, blockerOrder, canPlaceOrder } = useOrderPlacementGate({ token });
  const [submitting, setSubmitting] = useState(false);

  const totalQty = useMemo(
    () => items.reduce((acc, entry) => acc + Number(entry.quantity || 0), 0),
    [items],
  );

  async function showUnpaidReceivedAlert(order) {
    const pay = await confirm({
      title: t("portal.cart.unpaidReceivedBlockTitle"),
      message: t("portal.cart.unpaidReceivedBlockMessage", { id: order.id }),
      confirmLabel: t("portal.cart.unpaidReceivedPayNow"),
      tone: "primary",
    });
    if (pay) {
      navigate(`/portal/pay/${order.id}`, { state: { order } });
    }
  }

  async function handlePreOrder() {
    if (items.length === 0) {
      await alert({
        title: t("portal.cart.emptyAlertTitle"),
        message: t("portal.cart.emptyAlertMessage"),
      });
      return;
    }
    if (orderWindowClosed) {
      await alert({
        title: t("portal.orderWindow.closedTitle"),
        message: t("portal.orderWindow.closedAlertMessage"),
      });
      return;
    }
    if (blockerOrder) {
      await showUnpaidReceivedAlert(blockerOrder);
      return;
    }

    setSubmitting(true);
    try {
      await preOrderCart(token, user, items);
      clearCart();
      const viewOrders = await confirm({
        title: t("portal.cart.preOrderReadyTitle"),
        message: t("portal.cart.viewMyOrders"),
        confirmLabel: t("portal.cart.viewMyOrders"),
        cancelLabel: t("portal.cart.continueShopping"),
        tone: "primary",
      });
      navigate(viewOrders ? "/portal/orders" : "/portal/items");
    } catch (err) {
      await alert({
        title: t("portal.cart.preOrderFailedTitle"),
        message: getApiErrorMessage(err, t("portal.cart.preOrderFailedDefault")),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const subtitleKey =
    totalQty === 1 ? "portal.cart.subtitle" : "portal.cart.subtitle_plural";

  return (
    <div className={`portal-customer-cart${submitting ? " portal-customer-cart--busy" : ""}`}>
      <div className="portal-stack-header">
        <Link to="/portal/items" className="portal-back" aria-label="Back">
          ←
        </Link>
        <div>
          <h1>{t("portal.cart.title")}</h1>
          <p className="portal-card-meta">{t(subtitleKey, { count: totalQty || totalItems })}</p>
        </div>
      </div>

      {orderWindowClosed ? (
        <div className="portal-banner">{t("portal.orderWindow.closedBanner")}</div>
      ) : null}
      {blockerOrder ? (
        <div className="portal-banner">
          {t("portal.cart.unpaidReceivedBanner")}{" "}
          <button
            type="button"
            className="portal-banner__link"
            onClick={() => void showUnpaidReceivedAlert(blockerOrder)}
          >
            {t("portal.cart.unpaidReceivedPayNow")}
          </button>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="portal-empty">
          <h2>{t("portal.cart.emptyTitle")}</h2>
          <p>{t("portal.cart.emptySubtitle")}</p>
        </div>
      ) : (
        <>
          {items.map((entry) => (
            <article key={entry.item.id} className="portal-card">
              <h3>{entry.item.name}</h3>
              <p className="portal-card-meta">
                {entry.item.sku ? t("portal.cart.sku", { sku: entry.item.sku }) : null}
              </p>
              <div className="portal-row" style={{ borderBottom: 0, paddingBottom: 0 }}>
                <div className="portal-qty">
                  <button
                    type="button"
                    onClick={() => updateQuantity(entry.item.id, entry.quantity - 1)}
                    aria-label={t("portal.cart.decreaseQty", { name: entry.item.name })}
                  >
                    −
                  </button>
                  <span className="portal-qty__value">{entry.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(entry.item.id, entry.quantity + 1)}
                    aria-label={t("portal.cart.increaseQty", { name: entry.item.name })}
                  >
                    +
                  </button>
                </div>
                <PortalButton tone="danger-text" onClick={() => removeItem(entry.item.id)}>
                  {t("portal.cart.remove")}
                </PortalButton>
              </div>
            </article>
          ))}

          <div className="portal-customer-cart__footer">
            <p className="portal-customer-cart__total">
              {t("portal.cart.total", { count: totalQty })}
            </p>
            <PortalButton
              tone="success"
              disabled={submitting || !canPlaceOrder}
              onClick={() => void handlePreOrder()}
            >
              {submitting ? t("portal.common.loading") : t("portal.cart.preOrder")}
            </PortalButton>
          </div>
        </>
      )}
    </div>
  );
}
