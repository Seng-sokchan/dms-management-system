import { useTranslation } from "react-i18next";

/**
 * Shared create/edit customer fields (chrome provided by FormModal).
 */
export function CustomerForm({
  mode = "create",
  formId = "customer-form",
  value,
  onChange,
  onSubmit,
  depots = [],
  provinces = [],
}) {
  const { t } = useTranslation();
  const prefix = mode === "edit" ? "customer-edit" : "customer";

  function patch(partial) {
    onChange({ ...value, ...partial });
  }

  return (
    <form id={formId} className="form" onSubmit={onSubmit}>
      {mode === "create" ? (
        <p className="section-lead section-lead--tight form-grid--full">{t("customers.formTitle")}</p>
      ) : null}
      <div className="form-grid form-grid--2">
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-name`}>
            {t("customers.name")}
          </label>
          <input
            id={`${prefix}-name`}
            value={value.name || ""}
            onChange={(event) => patch({ name: event.target.value })}
            placeholder={t("customers.name")}
            required
            minLength={2}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-phone`}>
            {t("customers.phone")}
          </label>
          <input
            id={`${prefix}-phone`}
            value={value.phone || ""}
            onChange={(event) => patch({ phone: event.target.value })}
            placeholder={t("customers.phone")}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-latitude`}>
            {t("customers.latitude")}
          </label>
          <input
            id={`${prefix}-latitude`}
            type="number"
            step="any"
            value={value.latitude ?? ""}
            onChange={(event) => patch({ latitude: event.target.value })}
            placeholder={t("customers.latitudePlaceholder")}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-longitude`}>
            {t("customers.longitude")}
          </label>
          <input
            id={`${prefix}-longitude`}
            type="number"
            step="any"
            value={value.longitude ?? ""}
            onChange={(event) => patch({ longitude: event.target.value })}
            placeholder={t("customers.longitudePlaceholder")}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-depot`}>
            {t("customers.depot", { defaultValue: "Depot" })}{" "}
            <span className="form-optional">({t("createOrder.optional")})</span>
          </label>
          <select
            id={`${prefix}-depot`}
            value={value.depotId || ""}
            onChange={(event) => patch({ depotId: event.target.value })}
          >
            <option value="">{t("customers.selectDepot", { defaultValue: "No depot" })}</option>
            {depots.map((depot) => (
              <option key={depot.id} value={depot.id}>
                {depot.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-province`}>
            {t("customers.province", { defaultValue: "Province" })}{" "}
            <span className="form-optional">({t("createOrder.optional")})</span>
          </label>
          <select
            id={`${prefix}-province`}
            value={value.provinceId || ""}
            onChange={(event) => patch({ provinceId: event.target.value })}
          >
            <option value="">{t("customers.selectProvince", { defaultValue: "No province" })}</option>
            {provinces.map((province) => (
              <option key={province.id} value={province.id}>
                {province.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </form>
  );
}
