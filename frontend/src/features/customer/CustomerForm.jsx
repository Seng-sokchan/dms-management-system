import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import "./CustomerForm.css";

export function CustomerForm({
  depots = [],
  newCustomer,
  setNewCustomer,
  onCreateCustomer,
}) {
  const { t } = useTranslation();

  return (
    <form className="panel form customer-form" onSubmit={onCreateCustomer}>
      <h3>{t("customers.formTitle")}</h3>
      <label className="form-label" htmlFor="customer-name">
        {t("customers.name")}
      </label>
      <input
        id="customer-name"
        value={newCustomer.name}
        onChange={(event) => setNewCustomer({ ...newCustomer, name: event.target.value })}
        placeholder={t("customers.name")}
        required
        minLength={2}
      />
      <label className="form-label" htmlFor="customer-phone">
        {t("customers.phone")}
      </label>
      <input
        id="customer-phone"
        value={newCustomer.phone}
        onChange={(event) => setNewCustomer({ ...newCustomer, phone: event.target.value })}
        placeholder={t("customers.phone")}
      />
      <label className="form-label" htmlFor="customer-latitude">
        {t("customers.latitude")}
      </label>
      <input
        id="customer-latitude"
        type="number"
        step="any"
        value={newCustomer.latitude}
        onChange={(event) => setNewCustomer({ ...newCustomer, latitude: event.target.value })}
        placeholder={t("customers.latitudePlaceholder")}
      />
      <label className="form-label" htmlFor="customer-longitude">
        {t("customers.longitude")}
      </label>
      <input
        id="customer-longitude"
        type="number"
        step="any"
        value={newCustomer.longitude}
        onChange={(event) => setNewCustomer({ ...newCustomer, longitude: event.target.value })}
        placeholder={t("customers.longitudePlaceholder")}
      />
      <label className="form-label" htmlFor="customer-depot">
        {t("customers.depot", { defaultValue: "Depot" })}{" "}
        <span className="form-optional">({t("createOrder.optional")})</span>
      </label>
      <select
        id="customer-depot"
        value={newCustomer.depotId}
        onChange={(event) => setNewCustomer({ ...newCustomer, depotId: event.target.value })}
      >
        <option value="">{t("customers.selectDepot", { defaultValue: "No depot" })}</option>
        {depots.map((depot) => (
          <option key={depot.id} value={depot.id}>
            {depot.name}
          </option>
        ))}
      </select>
      <Button type="submit" variant="primary">
        {t("customers.save")}
      </Button>
    </form>
  );
}
