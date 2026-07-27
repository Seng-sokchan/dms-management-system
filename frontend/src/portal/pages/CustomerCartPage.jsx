import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCart } from "../context/CartContext";
import { useOrderPlacementGate } from "../hooks/useOrderPlacementGate";
import { useConfirm } from "../../components/ui/ConfirmProvider";
import { getApiErrorMessage } from "../../services/apiClient";
import { preOrderCart } from "../services/orders";
import { PortalButton } from "../components/PortalButton";

export function CustomerCartPage({ token, user }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { alert } = useConfirm();
  const { items, totalItems, updateQuantity, removeItem, clearCart } = useCart();
  const { orderWindowClosed, blockerOrder, canPlaceOrder } = useOrderPlacementGate({ token });
  const [submitting, setSubmitting] = useState(false);

  async function handlePreOrder() {
    if (!canPlaceOrder) {
      if (orderWindowClosed) {
        await alert({
          title: t("portal.orderWindow.closedTitle"),
          message: t("portal.orderWindow.closedAlertMessage"),
        });
        return;
      }
      if (blockerOrder) {
        await alert({
          title: t("portal.cart.unpaidReceivedBlockTitle"),
          message: t("portal.cart.unpaidReceivedBlockMessage", { id: blockerOrder.id }),
        });
        return;
      }
    }
    if (items.length === 0) {
      await alert({
        title: t("portal.cart.emptyAlertTitle"),
        message: t("portal.cart.emptyAlertMessage"),
      });
      return;
    }

    setSubmitting(true);
    try {
      await preOrderCart(token, user, items);
      clearCart();
      await alert({
        title: t("portal.cart.preOrderReadyTitle"),
        message: t("portal.cart.viewMyOrders"),
      });
      navigate("/portal/orders");
    } catch (err) {
      await alert({
        title: t("portal.cart.preOrderFailedTitle"),
        message: getApiErrorMessage(err, t("portal.cart.preOrderFailedDefault")),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="portal-stack-header">
        <Link to="/portal/items" className="portal-back" aria-label="Back">
          ←
        </Link>
        <div>
          <h1>{t("portal.cart.title")}</h1>
          <p className="portal-card-meta">{t("portal.cart.subtitle", { count: totalItems })}</p>
        </div>
      </div>

      {orderWindowClosed ? (
        <div className="portal-banner">{t("portal.orderWindow.closedBanner")}</div>
      ) : null}
      {blockerOrder ? (
        <div className="portal-banner">
          {t("portal.cart.unpaidReceivedBanner")}{" "}
          <Link to={`/portal/pay/${blockerOrder.id}`}>
            {t("portal.cart.unpaidReceivedPayNow")}
          </Link>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="portal-empty">
          <h2>{t("portal.cart.emptyTitle")}</h2>
          <p>{t("portal.cart.emptySubtitle")}</p>
          <div className="portal-actions" style={{ justifyContent: "center" }}>
            <Link to="/portal/items" className="portal-btn portal-btn--primary">
              {t("portal.cart.continueShopping")}
            </Link>
          </div>
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
                  <button type="button" onClick={() => updateQuantity(entry.item.id, entry.quantity - 1)}>
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={entry.quantity}
                    onChange={(e) => updateQuantity(entry.item.id, e.target.value)}
                  />
                  <button type="button" onClick={() => updateQuantity(entry.item.id, entry.quantity + 1)}>
                    +
                  </button>
                </div>
                <PortalButton tone="danger-text" onClick={() => removeItem(entry.item.id)}>
                  {t("portal.cart.remove")}
                </PortalButton>
              </div>
            </article>
          ))}

          <div className="portal-actions">
            <PortalButton
              tone="success"
              block
              disabled={submitting || !canPlaceOrder}
              onClick={handlePreOrder}
            >
              {submitting ? t("portal.common.loading") : t("portal.cart.preOrder")}
            </PortalButton>
          </div>
        </>
      )}
    </div>
  );
}
