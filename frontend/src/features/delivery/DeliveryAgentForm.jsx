import { useTranslation } from "react-i18next";

export function DeliveryAgentForm({
  mode = "create",
  formId = "delivery-agent-form",
  value,
  onChange,
  onSubmit,
}) {
  const { t } = useTranslation();
  const prefix = mode === "edit" ? "delivery-edit" : "delivery";

  function patch(partial) {
    onChange({ ...value, ...partial });
  }

  return (
    <form id={formId} className="form" onSubmit={onSubmit}>
      <div className="form-grid form-grid--2">
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-name`}>
            {t("deliveryAgents.namePh")}
          </label>
          <input
            id={`${prefix}-name`}
            value={value.name || ""}
            onChange={(event) => patch({ name: event.target.value })}
            placeholder={t("deliveryAgents.namePh")}
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-phone`}>
            {t("deliveryAgents.phonePh")}
          </label>
          <input
            id={`${prefix}-phone`}
            value={value.phone || ""}
            onChange={(event) => patch({ phone: event.target.value })}
            placeholder={t("deliveryAgents.phonePh")}
            required
          />
        </div>
        <div className="form-field form-grid--full">
          <label className="form-label" htmlFor={`${prefix}-vehicle`}>
            {t("deliveryAgents.vehiclePh")}
          </label>
          <input
            id={`${prefix}-vehicle`}
            value={value.vehicleType || ""}
            onChange={(event) => patch({ vehicleType: event.target.value })}
            placeholder={t("deliveryAgents.vehiclePh")}
            required
          />
        </div>
      </div>
    </form>
  );
}
