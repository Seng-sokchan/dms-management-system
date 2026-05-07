import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import "./ItemForm.css";

export function ItemForm({ catalogs = [], newItem, setNewItem, onCreateItem }) {
  const { t } = useTranslation();

  return (
    <form className="panel form item-form" onSubmit={onCreateItem}>
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
      <Button variant="primary" type="submit">
        {t("items.save")}
      </Button>
    </form>
  );
}
