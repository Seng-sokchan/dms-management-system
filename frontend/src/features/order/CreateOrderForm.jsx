import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import "./CreateOrderForm.css";

export function CreateOrderForm({
  customers = [],
  items = [],
  customerReadonly = false,
  newOrder,
  setNewOrder,
  onCreateOrder,
}) {
  const { t } = useTranslation();

  function onCatalogChange(event) {
    const value = event.target.value;
    if (!value) {
      setNewOrder({ ...newOrder, itemId: "" });
      return;
    }
    const picked = items.find((it) => it.id === value);
    if (!picked) return;
    setNewOrder({
      ...newOrder,
      itemId: picked.id,
    });
  }

  const catalogValue = newOrder.itemId && items.some((it) => it.id === newOrder.itemId) ? newOrder.itemId : "";

  return (
    <form className="panel form create-order-form" onSubmit={onCreateOrder}>
      <h3>{t("createOrder.formTitle")}</h3>
      <label className="form-label" htmlFor="order-customer">
        {t("createOrder.customerName")}
      </label>
      <select
        id="order-customer"
        value={newOrder.customerId || ""}
        onChange={(event) => setNewOrder({ ...newOrder, customerId: event.target.value })}
        required
        disabled={customerReadonly}
      >
        <option value="">{t("createOrder.customerPlaceholder")}</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.phone ? `${customer.name} (${customer.phone})` : customer.name}
          </option>
        ))}
      </select>
      <label className="form-label" htmlFor="order-catalog-item">
        {t("createOrder.catalogItemRequired")}
      </label>
      <select id="order-catalog-item" value={catalogValue} onChange={onCatalogChange} required>
        <option value="">{t("createOrder.catalogPlaceholder")}</option>
        {items.map((it) => (
          <option key={it.id} value={it.id}>
            {it.catalogName
              ? `${it.catalogName} — ${it.name}${it.sku ? ` (${it.sku})` : ""}`
              : it.sku
                ? `${it.name} (${it.sku})`
                : it.name}
          </option>
        ))}
      </select>
      <label className="form-label" htmlFor="order-qty">
        {t("createOrder.orderedQty")}
      </label>
      <input
        id="order-qty"
        type="number"
        value={newOrder.orderedQty}
        onChange={(event) => setNewOrder({ ...newOrder, orderedQty: event.target.value })}
        min="1"
        placeholder={t("createOrder.orderedQty")}
        required
      />
      <Button
        variant="primary"
        type="submit"
        disabled={items.length === 0 || customers.length === 0}
      >
        {t("createOrder.submit")}
      </Button>
      {customers.length === 0 ? <p className="entity-list-empty">{t("createOrder.noCustomersHint")}</p> : null}
      {items.length === 0 ? <p className="entity-list-empty">{t("createOrder.noItemsHint")}</p> : null}
    </form>
  );
}

