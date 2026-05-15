import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CreateOrderForm } from "../features/order/CreateOrderForm";

export function CreateOrderPage({
  user,
  customers,
  items,
  newOrder,
  setNewOrder,
  onCreateOrder,
}) {
  const { t } = useTranslation();
  const isCustomerRole = user?.role === "Customer";
  const linkedCustomer = isCustomerRole
    ? customers.find((customer) => String(customer.userId) === String(user?.id))
    : null;

  useEffect(() => {
    if (!isCustomerRole) return;
    if (!linkedCustomer) return;
    if (newOrder.customerId === linkedCustomer.id) return;
    setNewOrder((prev) => ({ ...prev, customerId: linkedCustomer.id }));
  }, [isCustomerRole, linkedCustomer, newOrder.customerId, setNewOrder]);

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("createOrder.title")}</h2>
        <p className="section-lead">{t("createOrder.lead")}</p>
      </div>
      <div className="form-single">
        <CreateOrderForm
          customers={customers}
          items={items}
          customerReadonly={isCustomerRole}
          newOrder={newOrder}
          setNewOrder={setNewOrder}
          onCreateOrder={onCreateOrder}
        />
      </div>
    </section>
  );
}
