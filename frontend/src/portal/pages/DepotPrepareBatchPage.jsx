import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDepotBatchCart } from "../context/DepotBatchCartContext";
import { useOrderWindow } from "../hooks/useOrderWindow";
import { getApiErrorMessage } from "../../services/apiClient";
import { fetchPortalCustomers, fetchPortalItems } from "../services/orders";
import { SectionHeader } from "../components/SectionHeader";
import { PortalButton } from "../components/PortalButton";
import { TabIcon } from "../components/TabIcon";

/**
 * Mobile-matched Prepare Batch: customer list → item picker sheet → cart.
 */
export function DepotPrepareBatchPage({ token, user }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cartByCustomer, totalLines, addLine } = useDepotBatchCart();
  const { orderWindowClosed } = useOrderWindow();
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pickerCustomerId, setPickerCustomerId] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchPortalCustomers(token), fetchPortalItems(token)])
      .then(([customerRows, itemRows]) => {
        if (cancelled) return;
        setCustomers(customerRows);
        setItems(itemRows);
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, t("portal.depot.loadDataFailed")));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t, token]);

  const pickerCustomer = useMemo(
    () => customers.find((c) => String(c.id) === String(pickerCustomerId)),
    [customers, pickerCustomerId],
  );

  const alreadyChosen = useMemo(
    () => new Set((cartByCustomer[pickerCustomerId] || []).map((line) => String(line.itemId))),
    [cartByCustomer, pickerCustomerId],
  );

  function handlePick(itemId) {
    if (!pickerCustomerId || orderWindowClosed) return;
    addLine(pickerCustomerId, itemId);
  }

  return (
    <div>
      <SectionHeader
        title={t("portal.depot.prepareTitle")}
        subtitle={
          user?.depotName
            ? t("portal.depot.prepareSubtitleWithDepot", { name: user.depotName })
            : t("portal.depot.prepareSubtitle")
        }
        action={
          <button
            type="button"
            className="portal-pill-badge"
            onClick={() => navigate("/portal/depot-cart")}
          >
            <TabIcon name="cart" active />
            {t("portal.depot.openCart")}
            {totalLines > 0 ? <span className="count">{totalLines > 99 ? "99+" : totalLines}</span> : null}
          </button>
        }
      />

      {orderWindowClosed ? (
        <div className="portal-banner">{t("portal.orderWindow.closedBanner")}</div>
      ) : null}

      {loading ? <p className="portal-empty">{t("portal.depot.loadingData")}</p> : null}

      {!loading && error ? (
        <article className="portal-card">
          <h3>{t("portal.depot.loadErrorTitle")}</h3>
          <p className="portal-card-meta">{error}</p>
          <div className="portal-actions">
            <PortalButton
              onClick={() => {
                setLoading(true);
                setError("");
                Promise.all([fetchPortalCustomers(token), fetchPortalItems(token)])
                  .then(([customerRows, itemRows]) => {
                    setCustomers(customerRows);
                    setItems(itemRows);
                  })
                  .catch((err) => {
                    setError(getApiErrorMessage(err, t("portal.depot.loadDataFailed")));
                  })
                  .finally(() => setLoading(false));
              }}
            >
              {t("portal.common.refresh")}
            </PortalButton>
          </div>
        </article>
      ) : null}

      {!loading && !error && customers.length === 0 ? (
        <div className="portal-empty">
          <h2>{t("portal.depot.noCustomersTitle")}</h2>
          <p>{t("portal.depot.noCustomersSubtitle")}</p>
        </div>
      ) : null}

      {!loading && !error
        ? customers.map((customer) => {
            const lineCount = (cartByCustomer[String(customer.id)] || []).length;
            return (
              <button
                key={customer.id}
                type="button"
                className="portal-card portal-customer-row"
                disabled={orderWindowClosed}
                onClick={() => setPickerCustomerId(String(customer.id))}
              >
                <div className="portal-customer-row__body">
                  <h3>{customer.name || t("portal.depot.unnamed")}</h3>
                  <p className="portal-card-meta">
                    {customer.phone || t("portal.depot.noPhone")}
                    {lineCount > 0
                      ? ` · ${t("portal.depot.linesInCart", { count: lineCount, defaultValue: "{{count}} in cart" })}`
                      : ""}
                  </p>
                </div>
                <span className="portal-customer-row__chevron" aria-hidden>
                  ›
                </span>
              </button>
            );
          })
        : null}

      {pickerCustomerId ? (
        <ItemPickerSheet
          customerName={pickerCustomer?.name || t("portal.depot.unnamed")}
          items={items}
          alreadyChosen={alreadyChosen}
          onPick={handlePick}
          onClose={() => setPickerCustomerId("")}
        />
      ) : null}
    </div>
  );
}

function ItemPickerSheet({ customerName, items, alreadyChosen, onPick, onClose }) {
  const { t } = useTranslation();

  return (
    <div className="portal-sheet-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="portal-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="portal-sheet__header">
          <div>
            <h2>{t("portal.depot.pickItem")}</h2>
            <p className="portal-card-meta">{customerName}</p>
          </div>
          <button type="button" className="portal-sheet__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="portal-sheet__list">
          {items.length === 0 ? (
            <p className="portal-empty">{t("portal.depot.noItemsMatch")}</p>
          ) : (
            items.map((item) => {
              const isAdded = alreadyChosen.has(String(item.id));
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`portal-sheet__row${isAdded ? " is-disabled" : ""}`}
                  disabled={isAdded}
                  onClick={() => onPick(item.id)}
                >
                  <span className="portal-sheet__row-text">
                    <strong>{item.name}</strong>
                    {item.sku ? <small>SKU: {item.sku}</small> : null}
                  </span>
                  {isAdded ? (
                    <span className="portal-sheet__badge">{t("portal.depot.added")}</span>
                  ) : (
                    <span className="portal-sheet__plus" aria-hidden>
                      +
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
