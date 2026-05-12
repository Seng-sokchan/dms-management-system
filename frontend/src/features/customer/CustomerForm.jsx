import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import "./CustomerForm.css";

export function CustomerForm({
  addresses = [],
  depots = [],
  customerUsers = [],
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
      <label className="form-label" htmlFor="customer-address">
        {t("customers.groupAddress")}
      </label>
      <select
        id="customer-address"
        value={newCustomer.address}
        onChange={(event) => setNewCustomer({ ...newCustomer, address: event.target.value })}
        required
      >
        <option value="">{t("customers.selectAddress")}</option>
        {addresses.map((address) => (
          <option key={address.id} value={address.id}>
            {address.name}
          </option>
        ))}
      </select>
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
      <label className="form-label" htmlFor="customer-user">
        {t("customers.user")} <span className="form-optional">({t("createOrder.optional")})</span>
      </label>
      <select
        id="customer-user"
        value={newCustomer.userId}
        onChange={(event) => setNewCustomer({ ...newCustomer, userId: event.target.value })}
      >
        <option value="">{t("customers.selectUser")}</option>
        {customerUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.username})
          </option>
        ))}
      </select>
      <label className="form-label" htmlFor="customer-depot">
        {t("customers.depot", { defaultValue: "Depot" })}{" "}
        <span className="form-optional">({t("createOrder.optional")})</span>
      </label>
      <select
        id="customer-depot"
        value={newCustomer.depotId || ""}
        onChange={(event) => setNewCustomer({ ...newCustomer, depotId: event.target.value })}
      >
        <option value="">{t("customers.selectDepot", { defaultValue: "— Select depot —" })}</option>
        {depots.map((depot) => (
          <option key={depot.id} value={depot.id}>
            {depot.name}
          </option>
        ))}
      </select>
      <Button variant="primary" type="submit">
        {t("customers.save")}
      </Button>
    </form>
  );
}
