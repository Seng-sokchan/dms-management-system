import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDepotBatchCart } from "../context/DepotBatchCartContext";
import { useOrderWindow } from "../hooks/useOrderWindow";
import { useConfirm } from "../../components/ui/ConfirmProvider";
import { getApiErrorMessage } from "../../services/apiClient";
import {
  createDepotBatch,
  fetchPortalCustomers,
  fetchPortalItems,
} from "../services/orders";
import "./DepotCartPage.css";

export function DepotCartPage({ token }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { alert } = useConfirm();
  const {
    cartByCustomer,
    totalLines,
    customerCount,
    updateLineQty,
    removeLine,
    clearCustomer,
    clearAll,
  } = useDepotBatchCart();
  const { orderWindowClosed } = useOrderWindow();
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchPortalCustomers(token), fetchPortalItems(token)])
      .then(([customerRows, itemRows]) => {
        if (cancelled) return;
        setCustomers(customerRows);
        setItems(itemRows);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);

  const customerNameById = useMemo(() => {
    const map = new Map();
    for (const c of customers) map.set(String(c.id), c.name || t("portal.depot.unnamed"));
    return map;
  }, [customers, t]);

  const itemNameById = useMemo(() => {
    const map = new Map();
    for (const item of items) map.set(String(item.id), item.name || item.sku || item.id);
    return map;
  }, [items]);

  async function handleSubmit() {
    if (orderWindowClosed) {
      await alert({
        title: t("portal.orderWindow.closedTitle"),
        message: t("portal.orderWindow.closedAlertMessage"),
      });
      return;
    }
    if (totalLines === 0) {
      await alert({
        title: t("portal.depot.batchEmptyTitle"),
        message: t("portal.depot.batchEmptyMessage"),
      });
      return;
    }

    const lines = [];
    for (const [customerId, rows] of Object.entries(cartByCustomer)) {
      for (const row of rows || []) {
        lines.push({
          customerId: String(customerId),
          itemId: String(row.itemId),
          orderedQty: Number(row.orderedQty) || 1,
          currency: "KHR",
        });
      }
    }

    setSubmitting(true);
    try {
      const created = await createDepotBatch(token, lines);
      const count = Array.isArray(created) ? created.length : 1;
      clearAll();
      await alert({
        title: t("portal.depot.batchSuccessTitle"),
        message: t("portal.depot.batchSuccessDetail", {
          count,
          customers: customerCount,
        }),
      });
      navigate("/portal/depot-orders");
    } catch (err) {
      await alert({
        title: t("portal.depot.batchFailedTitle"),
        message: getApiErrorMessage(err, t("portal.depot.batchFailedDefault")),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const entries = Object.entries(cartByCustomer).filter(
    ([, rows]) => Array.isArray(rows) && rows.length > 0,
  );

  return (
    <div className="batch-cart">
      <header className="batch-cart__header">
        <button
          type="button"
          className="batch-cart__back"
          onClick={() => navigate("/portal/prepare-batch")}
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="batch-cart__titles">
          <h1>{t("portal.depot.cartTitle")}</h1>
          <p>{t("portal.depot.cartSubtitle", { lines: totalLines, customers: customerCount })}</p>
        </div>
      </header>

      {orderWindowClosed ? (
        <div className="portal-banner">{t("portal.orderWindow.closedBanner")}</div>
      ) : null}

      {entries.length === 0 ? (
        <div className="batch-cart__empty">
          <h2>{t("portal.depot.cartEmptyTitle")}</h2>
          <p>{t("portal.depot.cartEmptySubtitle")}</p>
          <button
            type="button"
            className="batch-cart__soft-btn"
            onClick={() => navigate("/portal/prepare-batch")}
          >
            {t("portal.depot.prepareTitle")}
          </button>
        </div>
      ) : (
        <>
          <div className="batch-cart__list">
            {entries.map(([customerId, rows]) => (
              <article key={customerId} className="batch-cart__card">
                <div className="batch-cart__customer">
                  <h2>{customerNameById.get(String(customerId)) || customerId}</h2>
                </div>

                {rows.map((row) => (
                  <div key={`${customerId}-${row.itemId}`} className="batch-cart__line">
                    <p className="batch-cart__item-name">
                      {itemNameById.get(String(row.itemId)) || row.itemId}
                    </p>
                    <div className="batch-cart__line-actions">
                      <div className="batch-cart__qty-pill" role="group" aria-label="Quantity">
                        <button
                          type="button"
                          className="batch-cart__qty-btn"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            updateLineQty(
                              customerId,
                              row.itemId,
                              Math.max(1, Number(row.orderedQty) - 1),
                            )
                          }
                        >
                          −
                        </button>
                        <input
                          className="batch-cart__qty-input"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          aria-label="Quantity"
                          value={row.orderedQty}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => updateLineQty(customerId, row.itemId, e.target.value)}
                        />
                        <button
                          type="button"
                          className="batch-cart__qty-btn"
                          aria-label="Increase quantity"
                          onClick={() =>
                            updateLineQty(customerId, row.itemId, Number(row.orderedQty) + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="batch-cart__link-danger batch-cart__remove"
                        onClick={() => removeLine(customerId, row.itemId)}
                      >
                        {t("portal.cart.remove")}
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="batch-cart__link-danger batch-cart__clear"
                  onClick={() => clearCustomer(customerId)}
                >
                  {t("portal.depot.clearCustomer")}
                </button>
              </article>
            ))}
          </div>

          <div className="batch-cart__footer">
            <button
              type="button"
              className="batch-cart__submit"
              disabled={submitting || orderWindowClosed}
              onClick={handleSubmit}
            >
              {submitting ? t("portal.common.loading") : t("portal.depot.submitBatch")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
