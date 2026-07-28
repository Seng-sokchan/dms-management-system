import { useTranslation } from "react-i18next";
import "./ItemForm.css";

export function ItemForm({
  mode = "create",
  formId = "item-form",
  catalogs = [],
  value,
  onChange,
  onSubmit,
}) {
  const { t } = useTranslation();
  const prefix = mode === "edit" ? "item-edit" : "item";

  function patch(partial) {
    onChange({ ...value, ...partial });
  }

  return (
    <form id={formId} className="form" onSubmit={onSubmit}>
      {mode === "create" ? (
        <p className="section-lead section-lead--tight">{t("items.formBlurb")}</p>
      ) : null}
      <div className="form-pick-catalog">
        <label className="form-label" htmlFor={`${prefix}-catalog`}>
          {t("items.labelCatalog")}
        </label>
        <p className="form-hint">{t("items.catalogSelectHint")}</p>
        <select
          id={`${prefix}-catalog`}
          className="form-select-catalog"
          value={value.catalogId || ""}
          onChange={(event) => patch({ catalogId: event.target.value })}
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
      <div className="form-grid form-grid--2">
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-name`}>
            {t("items.labelName")}
          </label>
          <input
            id={`${prefix}-name`}
            value={value.name || ""}
            onChange={(event) => patch({ name: event.target.value })}
            placeholder={t("items.namePh")}
            required
            minLength={2}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-sku`}>
            {t("items.labelSku")}{" "}
            <span className="form-optional">({t("createOrder.optional")})</span>
          </label>
          <input
            id={`${prefix}-sku`}
            value={value.sku || ""}
            onChange={(event) => patch({ sku: event.target.value })}
            placeholder={t("items.skuPh")}
          />
        </div>
      </div>
    </form>
  );
}
