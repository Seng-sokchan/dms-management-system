import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { useConfirm } from "../../components/ui/ConfirmProvider";
import { usePagination } from "../../hooks/usePagination";

export function PriceFormTable({
  title,
  lead,
  formTitle,
  listTitle,
  emptyMessage,
  searchPlaceholder,
  confirmDeleteMessage,
  entityLabel,
  entityOptions = [],
  entityId,
  entityValue,
  onEntityChange,
  selectEntityLabel,
  items = [],
  form,
  onFormChange,
  onSubmit,
  rows = [],
  searchFields = [],
  columns = [],
  onDelete,
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const filteredRows = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      searchFields
        .map((field) => row[field])
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [rows, appliedSearch, searchFields]);

  const { page, pageSize, paged, setPage, setPageSize } = usePagination(filteredRows, {
    resetKey: appliedSearch,
  });

  async function submit(event) {
    event.preventDefault();
    await onSubmit();
  }

  async function handleDelete(id) {
    if (
      !(await confirm({
        title: t("confirm.deleteTitle"),
        message: confirmDeleteMessage,
        tone: "danger",
      }))
    ) {
      return;
    }
    await onDelete(id);
  }

  return (
    <section className="panel-stack">
      <SectionHeading title={title} lead={lead} />

      <form className="panel form" onSubmit={submit}>
        <h3>{formTitle}</h3>
        <label className="form-label" htmlFor={entityId}>
          {entityLabel}
        </label>
        <select
          id={entityId}
          value={entityValue}
          onChange={(event) => onEntityChange(event.target.value)}
          required
        >
          <option value="">{selectEntityLabel}</option>
          {entityOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="form-label" htmlFor={`${entityId}-item`}>
          {t("customerItemPrices.item")}
        </label>
        <select
          id={`${entityId}-item`}
          value={form.itemId}
          onChange={(event) => onFormChange({ ...form, itemId: event.target.value })}
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

        <label className="form-label" htmlFor={`${entityId}-currency`}>
          {t("customerItemPrices.currency")}
        </label>
        <select
          id={`${entityId}-currency`}
          value={form.currency}
          onChange={(event) => onFormChange({ ...form, currency: event.target.value })}
          required
        >
          <option value="KHR">KHR</option>
          <option value="USD">USD</option>
        </select>

        <label className="form-label" htmlFor={`${entityId}-unit-price`}>
          {t("customerItemPrices.unitPrice")}
        </label>
        <input
          id={`${entityId}-unit-price`}
          type="number"
          min="0"
          step="0.01"
          value={form.unitPrice}
          onChange={(event) => onFormChange({ ...form, unitPrice: event.target.value })}
          required
        />
        <div className="row-actions">
          <Button variant="primary" type="submit">
            {t("customerItemPrices.save")}
          </Button>
        </div>
      </form>

      <section className="panel entity-list">
        <h3>{listTitle}</h3>
        {rows.length === 0 ? (
          <p className="entity-list-empty">{emptyMessage}</p>
        ) : (
          <DataTable
            showSearch
            searchValue={searchText}
            onSearchValueChange={setSearchText}
            onSearch={() => setAppliedSearch(searchText)}
            searchPlaceholder={searchPlaceholder}
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
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>{t("customerItemPrices.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render(row)}</td>
                  ))}
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
function SectionHeading({ title, lead }) {
  return (
    <div className="section-heading">
      <h3>{title}</h3>
      <p className="section-lead">{lead}</p>
    </div>
  );
}

