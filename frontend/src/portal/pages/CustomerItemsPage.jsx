import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCart } from "../context/CartContext";
import { useOrderPlacementGate } from "../hooks/useOrderPlacementGate";
import { getApiErrorMessage } from "../../services/apiClient";
import { fetchPortalItems } from "../services/orders";
import { SectionHeader } from "../components/SectionHeader";
import { PortalButton } from "../components/PortalButton";
import { TabIcon } from "../components/TabIcon";

export function CustomerItemsPage({ token }) {
  const { t } = useTranslation();
  const { addItem, totalItems } = useCart();
  const { orderWindowClosed, blockerOrder } = useOrderPlacementGate({ token });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPortalItems(token)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, t("portal.items.loadFailed")));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t, token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        String(item.name || "").toLowerCase().includes(q)
        || String(item.sku || "").toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <div>
      <SectionHeader
        title={t("portal.items.title")}
        subtitle={t("portal.items.subtitle")}
        action={
          <Link to="/portal/cart" className="portal-pill-badge">
            <TabIcon name="cart" active />
            {t("portal.nav.cart")}
            {totalItems > 0 ? <span className="count">{totalItems}</span> : null}
          </Link>
        }
      />

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

      <input
        className="portal-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("portal.items.searchPlaceholder")}
      />

      {loading ? <p className="portal-empty">{t("portal.common.loading")}</p> : null}
      {error ? <p className="portal-empty">{error}</p> : null}
      {!loading && !error && filtered.length === 0 ? (
        <div className="portal-empty">
          <div className="portal-empty-icon">
            <TabIcon name="store" />
          </div>
          <h2>{t("portal.items.empty")}</h2>
        </div>
      ) : null}

      {filtered.map((item) => (
        <article key={item.id} className="portal-card">
          <h3>{item.name}</h3>
          <p className="portal-card-meta">
            {item.sku ? t("portal.cart.sku", { sku: item.sku }) : "—"}
          </p>
          <div className="portal-actions">
            <PortalButton
              block
              onClick={() => addItem(item)}
              disabled={orderWindowClosed || Boolean(blockerOrder)}
            >
              {t("portal.items.addToCart")}
            </PortalButton>
          </div>
        </article>
      ))}
    </div>
  );
}
