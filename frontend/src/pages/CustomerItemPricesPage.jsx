import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { PriceFormTable } from "../features/customerItemPrices/PriceFormTable";

const INITIAL_PRICE_FORM = {
  entityId: "",
  itemId: "",
  currency: "KHR",
  unitPrice: "",
};

function formatPrice(value) {
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export function CustomerItemPricesPage({
  customers = [],
  depots = [],
  items = [],
  customerItemPrices = [],
  depotItemPrices = [],
  onSaveCustomerPrice,
  onDeleteCustomerPrice,
  onSaveDepotPrice,
  onDeleteDepotPrice,
}) {
  const { t } = useTranslation();
  const [customerForm, setCustomerForm] = useState(INITIAL_PRICE_FORM);
  const [depotForm, setDepotForm] = useState(INITIAL_PRICE_FORM);

  const customersWithoutDepot = useMemo(
    () => customers.filter((customer) => !customer.depotId),
    [customers],
  );

  const customerOptions = useMemo(
    () => customersWithoutDepot.map((customer) => ({ id: customer.id, label: customer.name })),
    [customersWithoutDepot],
  );

  const depotOptions = useMemo(
    () => depots.map((depot) => ({ id: depot.id, label: depot.name })),
    [depots],
  );

  const priceColumn = {
    key: "unitPrice",
    label: t("customerItemPrices.unitPrice"),
    render: (row) => formatPrice(row.unitPrice),
  };

  async function submitCustomerPrice() {
    await onSaveCustomerPrice({
      customerId: String(customerForm.entityId),
      itemId: String(customerForm.itemId),
      currency: customerForm.currency,
      unitPrice: Number(customerForm.unitPrice),
    });
    setCustomerForm(INITIAL_PRICE_FORM);
  }

  async function submitDepotPrice() {
    await onSaveDepotPrice({
      depotId: String(depotForm.entityId),
      itemId: String(depotForm.itemId),
      currency: depotForm.currency,
      unitPrice: Number(depotForm.unitPrice),
    });
    setDepotForm(INITIAL_PRICE_FORM);
  }

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("customerItemPrices.title")}</h2>
        <p className="section-lead">{t("customerItemPrices.lead")}</p>
      </div>

      <PriceFormTable
        title={t("customerItemPrices.normalTitle")}
        lead={t("customerItemPrices.normalLead")}
        formTitle={t("customerItemPrices.formTitle")}
        listTitle={t("customerItemPrices.listTitle")}
        emptyMessage={t("customerItemPrices.empty")}
        searchPlaceholder={t("customerItemPrices.searchPlaceholder")}
        confirmDeleteMessage={t("customerItemPrices.confirmDelete")}
        entityLabel={t("customerItemPrices.customer")}
        entityOptions={customerOptions}
        entityId="cip-customer"
        entityValue={customerForm.entityId}
        onEntityChange={(value) => setCustomerForm({ ...customerForm, entityId: value })}
        selectEntityLabel={t("customerItemPrices.selectCustomer")}
        items={items}
        form={customerForm}
        onFormChange={setCustomerForm}
        onSubmit={submitCustomerPrice}
        rows={customerItemPrices}
        searchFields={["customerName", "itemName", "itemSku", "currency", "unitPrice"]}
        columns={[
          {
            key: "customer",
            label: t("customerItemPrices.customer"),
            render: (row) => row.customerName,
          },
          {
            key: "item",
            label: t("customerItemPrices.item"),
            render: (row) => row.itemName,
          },
          {
            key: "sku",
            label: "SKU",
            render: (row) => row.itemSku || "—",
          },
          {
            key: "currency",
            label: t("customerItemPrices.currency"),
            render: (row) => row.currency,
          },
          priceColumn,
        ]}
        onDelete={onDeleteCustomerPrice}
      />

      <PriceFormTable
        title={t("customerItemPrices.depotTitle")}
        lead={t("customerItemPrices.depotLead")}
        formTitle={t("depotItemPrices.formTitle")}
        listTitle={t("depotItemPrices.listTitle")}
        emptyMessage={t("depotItemPrices.empty")}
        searchPlaceholder={t("depotItemPrices.searchPlaceholder")}
        confirmDeleteMessage={t("depotItemPrices.confirmDelete")}
        entityLabel={t("depotItemPrices.depot")}
        entityOptions={depotOptions}
        entityId="dip-depot"
        entityValue={depotForm.entityId}
        onEntityChange={(value) => setDepotForm({ ...depotForm, entityId: value })}
        selectEntityLabel={t("depotItemPrices.selectDepot")}
        items={items}
        form={depotForm}
        onFormChange={setDepotForm}
        onSubmit={submitDepotPrice}
        rows={depotItemPrices}
        searchFields={["depotName", "itemName", "itemSku", "currency", "unitPrice"]}
        columns={[
          {
            key: "depot",
            label: t("depotItemPrices.depot"),
            render: (row) => row.depotName,
          },
          {
            key: "item",
            label: t("customerItemPrices.item"),
            render: (row) => row.itemName,
          },
          {
            key: "sku",
            label: "SKU",
            render: (row) => row.itemSku || "—",
          },
          {
            key: "currency",
            label: t("customerItemPrices.currency"),
            render: (row) => row.currency,
          },
          priceColumn,
        ]}
        onDelete={onDeleteDepotPrice}
      />
    </section>
  );
}
