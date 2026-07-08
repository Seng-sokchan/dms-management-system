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

export function DepotItemPricesPage({
  depots = [],
  items = [],
  depotItemPrices = [],
  onSaveDepotPrice,
  onDeleteDepotPrice,
}) {
  const { t } = useTranslation();
  const [depotForm, setDepotForm] = useState(INITIAL_PRICE_FORM);

  const depotOptions = useMemo(
    () => depots.map((depot) => ({ id: depot.id, label: depot.name })),
    [depots],
  );

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
        <h2>{t("depotItemPrices.title")}</h2>
        <p className="section-lead">{t("depotItemPrices.lead")}</p>
      </div>

      <PriceFormTable
        title={t("depotItemPrices.panelTitle")}
        lead={t("depotItemPrices.panelLead")}
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
          {
            key: "unitPrice",
            label: t("customerItemPrices.unitPrice"),
            render: (row) => formatPrice(row.unitPrice),
          },
        ]}
        onDelete={onDeleteDepotPrice}
      />
    </section>
  );
}
