import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ItemForm } from "../features/item/ItemForm";
import { useConfirm } from "../components/ui/ConfirmProvider";

function formatUnitPrice(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const EMPTY_EDIT = {
  id: "",
  catalogId: "",
  name: "",
  sku: "",
  defaultUnitPriceUsd: 1,
  defaultUnitPriceKhr: 4100,
};

export function ItemsPage({
  catalogs = [],
  items = [],
  newItem,
  setNewItem,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const hasCatalogs = catalogs.length > 0;
  const [editingItem, setEditingItem] = useState(EMPTY_EDIT);
  const isEditing = useMemo(() => Boolean(editingItem.id), [editingItem.id]);

  function startEdit(item) {
    setEditingItem({
      id: item.id,
      catalogId: item.catalogId || "",
      name: item.name || "",
      sku: item.sku || "",
      defaultUnitPriceUsd: Number(item.defaultUnitPriceUsd) || 0,
      defaultUnitPriceKhr: Number(item.defaultUnitPriceKhr) || 0,
    });
  }

  function cancelEdit() {
    setEditingItem(EMPTY_EDIT);
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingItem.id) return;
    await onUpdateItem(editingItem.id, {
      catalogId: editingItem.catalogId,
      name: editingItem.name,
      sku: editingItem.sku,
      defaultUnitPriceUsd: Number(editingItem.defaultUnitPriceUsd),
      defaultUnitPriceKhr: Number(editingItem.defaultUnitPriceKhr),
    });
    setEditingItem(EMPTY_EDIT);
  }

  async function handleDelete(itemId) {
    if (
      !(await confirm({
        title: t("confirm.deleteTitle"),
        message: t("items.confirmDelete"),
        tone: "danger",
      }))
    ) {
      return;
    }
    if (editingItem.id === itemId) {
      setEditingItem(EMPTY_EDIT);
    }
    await onDeleteItem(itemId);
  }

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("items.pageTitle")}</h2>
        <p className="section-lead">{t("items.pageLead")}</p>
      </div>

      {!hasCatalogs ? (
        <div className="panel entity-list">
          <p className="entity-list-empty">{t("items.needCatalogFirst")}</p>
          <p className="section-lead section-lead--next">
            <Link to="/catalogs" className="text-link">
              {t("items.linkToCatalogs")}
            </Link>
          </p>
        </div>
      ) : (
        <div className="form-single">
          <ItemForm
            catalogs={catalogs}
            newItem={newItem}
            setNewItem={setNewItem}
            onCreateItem={onCreateItem}
          />
        </div>
      )}

      {hasCatalogs ? (
        <section className="panel entity-list">
          <h3>{t("items.listTitle")}</h3>
          {items.length === 0 ? (
            <p className="entity-list-empty">{t("items.empty")}</p>
          ) : (
            <ul className="entity-list-ul">
              {items.map((it) => (
                <li key={it.id} className="entity-list-item">
                  <span className="entity-list-name">
                    {it.catalogName ? `${it.catalogName} — ${it.name}` : it.name}
                  </span>
                  <span className="entity-list-meta">
                    {it.sku ? `${t("items.rowSku", { sku: it.sku })} · ` : ""}
                    {t("items.rowDefaultUnitPrices", {
                      usd: formatUnitPrice(it.defaultUnitPriceUsd),
                      khr: formatUnitPrice(it.defaultUnitPriceKhr),
                    })}
                  </span>
                  <div className="row-actions">
                    <button type="button" className="btn-ghost btn-edit" onClick={() => startEdit(it)}>
                      {t("items.edit")}
                    </button>
                    <button type="button" className="btn-ghost btn-delete" onClick={() => void handleDelete(it.id)}>
                      {t("items.delete")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
      {isEditing ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="item-edit-title">
          <form className="panel form modal-card" onSubmit={submitEdit}>
            <h3 id="item-edit-title">{t("items.editTitle")}</h3>
            <label className="form-label" htmlFor="item-edit-catalog">
              {t("items.labelCatalog")}
            </label>
            <select
              id="item-edit-catalog"
              value={editingItem.catalogId}
              onChange={(event) => setEditingItem({ ...editingItem, catalogId: event.target.value })}
              required
            >
              <option value="">{t("items.catalogPlaceholder")}</option>
              {catalogs.map((catalog) => (
                <option key={catalog.id} value={catalog.id}>
                  {catalog.name}
                </option>
              ))}
            </select>
            <label className="form-label" htmlFor="item-edit-name">
              {t("items.labelName")}
            </label>
            <input
              id="item-edit-name"
              value={editingItem.name}
              onChange={(event) => setEditingItem({ ...editingItem, name: event.target.value })}
              required
              minLength={2}
            />
            <label className="form-label" htmlFor="item-edit-sku">
              {t("items.labelSku")}
            </label>
            <input
              id="item-edit-sku"
              value={editingItem.sku}
              onChange={(event) => setEditingItem({ ...editingItem, sku: event.target.value })}
            />
            <label className="form-label" htmlFor="item-edit-default-price-usd">
              {t("items.labelDefaultPriceUsd")}
            </label>
            <input
              id="item-edit-default-price-usd"
              type="number"
              min="0"
              step="0.01"
              value={editingItem.defaultUnitPriceUsd}
              onChange={(event) => setEditingItem({ ...editingItem, defaultUnitPriceUsd: event.target.value })}
              required
            />
            <label className="form-label" htmlFor="item-edit-default-price-khr">
              {t("items.labelDefaultPriceKhr")}
            </label>
            <input
              id="item-edit-default-price-khr"
              type="number"
              min="0"
              step="1"
              value={editingItem.defaultUnitPriceKhr}
              onChange={(event) => setEditingItem({ ...editingItem, defaultUnitPriceKhr: event.target.value })}
              required
            />
            <div className="row-actions">
              <button type="submit" className="btn-primary">
                {t("items.update")}
              </button>
              <button type="button" className="btn-ghost btn-cancel" onClick={cancelEdit}>
                {t("items.cancel")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
