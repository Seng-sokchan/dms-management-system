import { useTranslation } from "react-i18next";

export function CustomerForm({
  addresses = [],
  customerUsers = [],
  newCustomer,
  setNewCustomer,
  onCreateCustomer,
}) {
  const { t } = useTranslation();

  return (
    <form className="panel form" onSubmit={onCreateCustomer}>
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
      <label className="form-label" htmlFor="customer-user">
        {t("customers.user")}
      </label>
      <select
        id="customer-user"
        value={newCustomer.userId}
        onChange={(event) => setNewCustomer({ ...newCustomer, userId: event.target.value })}
        required
      >
        <option value="">{t("customers.selectUser")}</option>
        {customerUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.username})
          </option>
        ))}
      </select>
      {customerUsers.length === 0 ? (
        <p className="form-help">{t("customers.noCustomerUsersHint")}</p>
      ) : null}
      <label className="form-label" htmlFor="customer-sub-address">
        {t("customers.subAddress")}
      </label>
      <input
        id="customer-sub-address"
        value={newCustomer.subAddress}
        onChange={(event) => setNewCustomer({ ...newCustomer, subAddress: event.target.value })}
        placeholder={t("customers.subAddress")}
      />
      <button type="submit" className="btn-primary">
        {t("customers.save")}
      </button>
    </form>
  );
}
