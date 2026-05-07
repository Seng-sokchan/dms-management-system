import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { useConfirm } from "../components/ui/ConfirmProvider";
import { usePagination } from "../hooks/usePagination";

const INITIAL_FORM = {
  customerId: "",
  itemId: "",
  currency: "KHR",
  unitPrice: "",
};

export function CustomerItemPricesPage({
  customers = [],
  items = [],
  customerItemPrices = [],
  onSave,
  onDelete,
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [form, setForm] = useState(INITIAL_FORM);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const filteredRows = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    if (!q) return customerItemPrices;
    return customerItemPrices.filter((row) =>
      [row.customerName, row.itemName, row.itemSku, row.currency, row.unitPrice]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [customerItemPrices, appliedSearch]);

  const { page, pageSize, paged, setPage, setPageSize } = usePagination(filteredRows, {
    resetKey: appliedSearch,
  });

  async function submit(event) {
    event.preventDefault();
    await onSave({
      customerId: String(form.customerId),
      itemId: String(form.itemId),
      currency: form.currency,
      unitPrice: Number(form.unitPrice),
    });
    setForm(INITIAL_FORM);
  }

  async function handleDelete(id) {
    if (
      !(await confirm({
        title: t("confirm.deleteTitle"),
        message: t("customerItemPrices.confirmDelete"),
        tone: "danger",
      }))
    ) {
      return;
    }
    await onDelete(id);
  }

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("customerItemPrices.title")}</h2>
        <p className="section-lead">{t("customerItemPrices.lead")}</p>
      </div>

      <form className="panel form" onSubmit={submit}>
        <h3>{t("customerItemPrices.formTitle")}</h3>
        <label className="form-label" htmlFor="cip-customer">
          {t("customerItemPrices.customer")}
        </label>
        <select
          id="cip-customer"
          value={form.customerId}
          onChange={(event) => setForm({ ...form, customerId: event.target.value })}
          required
        >
          <option value="">{t("customerItemPrices.selectCustomer")}</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="form-label" htmlFor="cip-item">
          {t("customerItemPrices.item")}
        </label>
        <select
          id="cip-item"
          value={form.itemId}
          onChange={(event) => setForm({ ...form, itemId: event.target.value })}
          required
        >
          <option value="">{t("customerItemPrices.selectItem")}</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.sku ? ` (${item.sku})` : ""}
            </option>
          ))}
        </select>

        <label className="form-label" htmlFor="cip-currency">
          {t("customerItemPrices.currency")}
        </label>
        <select
          id="cip-currency"
          value={form.currency}
          onChange={(event) => setForm({ ...form, currency: event.target.value })}
          required
        >
          <option value="KHR">KHR</option>
          <option value="USD">USD</option>
        </select>

        <label className="form-label" htmlFor="cip-unit-price">
          {t("customerItemPrices.unitPrice")}
        </label>
        <input
          id="cip-unit-price"
          type="number"
          min="0"
          step="0.01"
          value={form.unitPrice}
          onChange={(event) => setForm({ ...form, unitPrice: event.target.value })}
          required
        />
        <div className="row-actions">
          <Button variant="primary" type="submit">
            {t("customerItemPrices.save")}
          </Button>
        </div>
      </form>

      <section className="panel entity-list">
        <h3>{t("customerItemPrices.listTitle")}</h3>
        {customerItemPrices.length === 0 ? (
          <p className="entity-list-empty">{t("customerItemPrices.empty")}</p>
        ) : (
          <DataTable
            showSearch
            searchValue={searchText}
            onSearchValueChange={setSearchText}
            onSearch={() => setAppliedSearch(searchText)}
            searchPlaceholder={t("customerItemPrices.searchPlaceholder")}
            searchButtonLabel={t("common.search", { defaultValue: "Search" })}
            pagination={{
              page,
              pageSize,
              totalRows: filteredRows.length,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("customerItemPrices.customer")}</th>
                <th>{t("customerItemPrices.item")}</th>
                <th>SKU</th>
                <th>{t("customerItemPrices.currency")}</th>
                <th>{t("customerItemPrices.unitPrice")}</th>
                <th>{t("customerItemPrices.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.customerName}</td>
                  <td>{row.itemName}</td>
                  <td>{row.itemSku || "—"}</td>
                  <td>{row.currency}</td>
                  <td>{Number(row.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>
                    <Button variant="ghost" tone="delete" onClick={() => void handleDelete(row.id)}>
                      {t("customerItemPrices.delete")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </section>
    </section>
  );
}
