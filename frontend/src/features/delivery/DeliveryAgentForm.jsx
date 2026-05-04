import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import "./DeliveryAgentForm.css";

export function DeliveryAgentForm({ newDelivery, setNewDelivery, onCreateDelivery }) {
  const { t } = useTranslation();

  return (
    <form className="panel form delivery-agent-form" onSubmit={onCreateDelivery}>
      <h3>{t("deliveryAgents.formTitle")}</h3>
      <label className="form-label" htmlFor="delivery-name">
        {t("deliveryAgents.namePh")}
      </label>
      <input
        id="delivery-name"
        value={newDelivery.name}
        onChange={(event) => setNewDelivery({ ...newDelivery, name: event.target.value })}
        placeholder={t("deliveryAgents.namePh")}
        required
      />
      <label className="form-label" htmlFor="delivery-phone">
        {t("deliveryAgents.phonePh")}
      </label>
      <input
        id="delivery-phone"
        value={newDelivery.phone}
        onChange={(event) => setNewDelivery({ ...newDelivery, phone: event.target.value })}
        placeholder={t("deliveryAgents.phonePh")}
        required
      />
      <label className="form-label" htmlFor="delivery-vehicle">
        {t("deliveryAgents.vehiclePh")}
      </label>
      <input
        id="delivery-vehicle"
        value={newDelivery.vehicleType}
        onChange={(event) => setNewDelivery({ ...newDelivery, vehicleType: event.target.value })}
        placeholder={t("deliveryAgents.vehiclePh")}
        required
      />
      <Button variant="primary" type="submit">
        {t("deliveryAgents.save")}
      </Button>
    </form>
  );
}

