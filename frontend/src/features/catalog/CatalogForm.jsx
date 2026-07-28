import { useTranslation } from "react-i18next";

export function CatalogForm({
  mode = "create",
  formId = "catalog-form",
  value,
  onChange,
  onSubmit,
}) {
  const { t } = useTranslation();
  const prefix = mode === "edit" ? "catalog-edit" : "catalog";

  function patch(partial) {
    onChange({ ...value, ...partial });
  }

  return (
    <form id={formId} className="form" onSubmit={onSubmit}>
      {mode === "create" ? (
        <p className="section-lead section-lead--tight">{t("catalogs.formBlurb")}</p>
      ) : null}
      <div className="form-grid">
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-name`}>
            {t("catalogs.labelName")}
          </label>
          <input
            id={`${prefix}-name`}
            value={value.name || ""}
            onChange={(event) => patch({ name: event.target.value })}
            placeholder={t("catalogs.namePh")}
            required
            minLength={2}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-note`}>
            {t("catalogs.labelNote")}{" "}
            <span className="form-optional">({t("createOrder.optional")})</span>
          </label>
          <input
            id={`${prefix}-note`}
            value={value.note || ""}
            onChange={(event) => patch({ note: event.target.value })}
            placeholder={t("catalogs.notePh")}
          />
        </div>
      </div>
    </form>
  );
}
