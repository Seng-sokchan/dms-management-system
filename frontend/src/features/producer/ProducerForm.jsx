import { useTranslation } from "react-i18next";

export function ProducerForm({
  mode = "create",
  formId = "producer-form",
  value,
  onChange,
  onSubmit,
}) {
  const { t } = useTranslation();
  const prefix = mode === "edit" ? "producer-edit" : "producer";

  function patch(partial) {
    onChange({ ...value, ...partial });
  }

  return (
    <form id={formId} className="form" onSubmit={onSubmit}>
      <div className="form-grid form-grid--2">
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-name`}>
            {t("producers.namePh")}
          </label>
          <input
            id={`${prefix}-name`}
            value={value.name || ""}
            onChange={(event) => patch({ name: event.target.value })}
            placeholder={t("producers.namePh")}
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-phone`}>
            {t("producers.phonePh")}
          </label>
          <input
            id={`${prefix}-phone`}
            value={value.phone || ""}
            onChange={(event) => patch({ phone: event.target.value })}
            placeholder={t("producers.phonePh")}
            required
          />
        </div>
        <div className="form-field form-grid--full">
          <label className="form-label" htmlFor={`${prefix}-capacity-note`}>
            {t("producers.capacityPh")}
          </label>
          <input
            id={`${prefix}-capacity-note`}
            value={value.capacityNote || ""}
            onChange={(event) => patch({ capacityNote: event.target.value })}
            placeholder={t("producers.capacityPh")}
          />
        </div>
      </div>
    </form>
  );
}
