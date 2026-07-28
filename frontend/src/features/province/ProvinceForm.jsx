import { useTranslation } from "react-i18next";

export function ProvinceForm({
  mode = "create",
  formId = "province-form",
  value,
  onChange,
  onSubmit,
}) {
  const { t } = useTranslation();
  const prefix = mode === "edit" ? "province-edit" : "province";

  return (
    <form id={formId} className="form" onSubmit={onSubmit}>
      {mode === "create" ? (
        <p className="section-lead section-lead--tight">{t("provinces.formBlurb")}</p>
      ) : null}
      <div className="form-grid">
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-name`}>
            {t("provinces.name")}
          </label>
          <input
            id={`${prefix}-name`}
            value={value.name || ""}
            onChange={(event) => onChange({ ...value, name: event.target.value })}
            placeholder={t("provinces.namePh")}
            required
            minLength={2}
          />
        </div>
      </div>
    </form>
  );
}
