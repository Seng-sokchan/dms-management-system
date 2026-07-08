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
  items = [],
  customerItemPrices = [],
  onSaveCustomerPrice,
  onDeleteCustomerPrice,
}) {
  const { t } = useTranslation();
  const [customerForm, setCustomerForm] = useState(INITIAL_PRICE_FORM);

  const customersWithoutDepot = useMemo(
    () => customers.filter((customer) => !customer.depotId),
    [customers],
  );

  const customerOptions = useMemo(
    () => customersWithoutDepot.map((customer) => ({ id: customer.id, label: customer.name })),
    [customersWithoutDepot],
  );

  async function submitCustomerPrice() {
    await onSaveCustomerPrice({
      customerId: String(customerForm.entityId),
      itemId: String(customerForm.itemId),
      currency: customerForm.currency,
      unitPrice: Number(customerForm.unitPrice),
    });
    setCustomerForm(INITIAL_PRICE_FORM);
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
          {
            key: "unitPrice",
            label: t("customerItemPrices.unitPrice"),
            render: (row) => formatPrice(row.unitPrice),
          },
        ]}
        onDelete={onDeleteCustomerPrice}
      />
    </section>
  );
}
