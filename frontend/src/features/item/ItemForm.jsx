import { useTranslation } from "react-i18next";

export function ItemForm({ catalogs = [], customers = [], newItem, setNewItem, onCreateItem }) {
  const { t } = useTranslation();

  return (
    <form className="panel form" onSubmit={onCreateItem}>
      <h3>{t("items.formTitle")}</h3>
      <p className="section-lead section-lead--tight">{t("items.formBlurb")}</p>
      <div className="form-pick-catalog">
        <label className="form-label" htmlFor="item-catalog">
          {t("items.labelCatalog")}
        </label>
        <p className="form-hint">{t("items.catalogSelectHint")}</p>
        <select
          id="item-catalog"
          className="form-select-catalog"
          value={newItem.catalogId || ""}
          onChange={(event) => setNewItem({ ...newItem, catalogId: event.target.value })}
          required
        >
          <option value="">{t("items.catalogPlaceholder")}</option>
          {catalogs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-pick-catalog">
        <label className="form-label" htmlFor="item-customer">
          {t("items.labelCustomer", { defaultValue: "Assigned customer" })}
        </label>
        <p className="form-hint">
          {t("items.customerSelectHint", { defaultValue: "Only this customer can see/select this item in mobile order creation." })}
        </p>
        <select
          id="item-customer"
          className="form-select-catalog"
          value={newItem.customerId || ""}
          onChange={(event) => setNewItem({ ...newItem, customerId: event.target.value })}
          required
        >
          <option value="">{t("items.customerPlaceholder", { defaultValue: "— Select a customer —" })}</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <label className="form-label" htmlFor="item-name">
        {t("items.labelName")}
      </label>
      <input
        id="item-name"
        value={newItem.name}
        onChange={(event) => setNewItem({ ...newItem, name: event.target.value })}
        placeholder={t("items.namePh")}
        required
      />
      <label className="form-label" htmlFor="item-sku">
        {t("items.labelSku")} <span className="form-optional">({t("createOrder.optional")})</span>
      </label>
      <input
        id="item-sku"
        value={newItem.sku}
        onChange={(event) => setNewItem({ ...newItem, sku: event.target.value })}
        placeholder={t("items.skuPh")}
      />
      <label className="form-label" htmlFor="item-default-price-usd">
        {t("items.labelDefaultPriceUsd")}
      </label>
      <input
        id="item-default-price-usd"
        type="number"
        value={newItem.defaultUnitPriceUsd}
        onChange={(event) => setNewItem({ ...newItem, defaultUnitPriceUsd: event.target.value })}
        min="0"
        step="0.01"
        placeholder={t("items.defaultPricePh")}
        required
      />
      <label className="form-label" htmlFor="item-default-price-khr">
        {t("items.labelDefaultPriceKhr")}
      </label>
      <input
        id="item-default-price-khr"
        type="number"
        value={newItem.defaultUnitPriceKhr}
        onChange={(event) => setNewItem({ ...newItem, defaultUnitPriceKhr: event.target.value })}
        min="0"
        step="1"
        placeholder={t("items.defaultPriceKhrPh")}
        required
      />
      <button type="submit" className="btn-primary">
        {t("items.save")}
      </button>
    </form>
  );
}
