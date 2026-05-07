import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePagination } from "../hooks/usePagination";
import { ItemForm } from "../features/item/ItemForm";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { useConfirm } from "../components/ui/ConfirmProvider";

const EMPTY_EDIT = {
  id: "",
  catalogId: "",
  name: "",
  sku: "",
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState(EMPTY_EDIT);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const isEditing = useMemo(() => Boolean(editingItem.id), [editingItem.id]);
  const filteredItems = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) =>
      [item.id, item.catalogName, item.name, item.sku]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [items, appliedSearch]);
  const {
    page,
    pageSize,
    paged: pagedItems,
    setPage,
    setPageSize,
  } = usePagination(filteredItems, { resetKey: appliedSearch });

  function startEdit(item) {
    setEditingItem({
      id: item.id,
      catalogId: item.catalogId || "",
      name: item.name || "",
      sku: item.sku || "",
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

  function openCreateModal() {
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
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
      ) : null}

      {hasCatalogs ? (
        <section className="panel entity-list">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{t("items.listTitle")}</h3>
            <Button variant="primary" onClick={openCreateModal}>
              {t("items.new", { defaultValue: "New" })}
            </Button>
          </div>
          {items.length === 0 ? (
            <p className="entity-list-empty">{t("items.empty")}</p>
          ) : (
            <DataTable
              showSearch
              searchValue={searchText}
              onSearchValueChange={setSearchText}
              onSearch={() => setAppliedSearch(searchText)}
              searchPlaceholder={t("items.searchPlaceholder", { defaultValue: "Search items..." })}
              searchButtonLabel={t("common.search", { defaultValue: "Search" })}
              pagination={{
                page,
                pageSize,
                totalRows: filteredItems.length,
                onPageChange: setPage,
                onPageSizeChange: setPageSize,
              }}
            >
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{t("items.labelCatalog")}</th>
                    <th>{t("items.labelName")}</th>
                    <th>{t("items.labelSku")}</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((it) => (
                    <tr key={it.id}>
                      <td>{it.id}</td>
                      <td>{it.catalogName || "—"}</td>
                      <td>{it.name}</td>
                      <td>{it.sku || "—"}</td>
                      <td>
                        <div className="row-actions">
                          <Button variant="ghost" tone="edit" onClick={() => startEdit(it)}>
                            {t("items.edit")}
                          </Button>
                          <Button variant="ghost" tone="delete" onClick={() => void handleDelete(it.id)}>
                            {t("items.delete")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </DataTable>
          )}
        </section>
      ) : null}
      {showCreateModal && hasCatalogs ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="item-create-title">
          <div className="modal-card">
            <ItemForm
              catalogs={catalogs}
              newItem={newItem}
              setNewItem={setNewItem}
              onCreateItem={async (event) => {
                await onCreateItem(event);
                closeCreateModal();
              }}
            />
            <div className="row-actions" style={{ marginTop: 12 }}>
              <Button variant="ghost" tone="cancel" onClick={closeCreateModal}>
                {t("items.cancel")}
              </Button>
            </div>
          </div>
        </div>
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
            <div className="row-actions">
              <Button variant="primary" type="submit">
                {t("items.update")}
              </Button>
              <Button variant="ghost" tone="cancel" onClick={cancelEdit}>
                {t("items.cancel")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
