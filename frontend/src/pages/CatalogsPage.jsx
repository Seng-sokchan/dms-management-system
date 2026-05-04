import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CatalogForm } from "../features/catalog/CatalogForm";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { useConfirm } from "../components/ui/ConfirmProvider";

const EMPTY_EDIT = { id: "", name: "", note: "" };

export function CatalogsPage({
  newCatalog,
  setNewCatalog,
  onCreateCatalog,
  onUpdateCatalog,
  onDeleteCatalog,
  catalogs = [],
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState(EMPTY_EDIT);
  const isEditing = useMemo(() => Boolean(editingCatalog.id), [editingCatalog.id]);

  function startEdit(catalog) {
    setEditingCatalog({ id: catalog.id, name: catalog.name || "", note: catalog.note || "" });
  }

  function cancelEdit() {
    setEditingCatalog(EMPTY_EDIT);
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingCatalog.id) return;
    await onUpdateCatalog(editingCatalog.id, { name: editingCatalog.name, note: editingCatalog.note });
    setEditingCatalog(EMPTY_EDIT);
  }

  async function handleDelete(catalogId) {
    if (
      !(await confirm({
        title: t("confirm.deleteTitle"),
        message: t("catalogs.confirmDelete"),
        tone: "danger",
      }))
    ) {
      return;
    }
    if (editingCatalog.id === catalogId) {
      setEditingCatalog(EMPTY_EDIT);
    }
    await onDeleteCatalog(catalogId);
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
        <h2>{t("catalogs.pageTitle")}</h2>
        <p className="section-lead">{t("catalogs.pageLead")}</p>
      </div>

      <section className="panel entity-list">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{t("catalogs.listTitle")}</h3>
          <Button variant="primary" onClick={openCreateModal}>
            {t("catalogs.new", { defaultValue: "New" })}
          </Button>
        </div>
        {catalogs.length === 0 ? (
          <p className="entity-list-empty">{t("catalogs.empty")}</p>
        ) : (
          <DataTable>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t("catalogs.labelName")}</th>
                  <th>{t("catalogs.labelNote")}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {catalogs.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.name}</td>
                    <td>{c.note || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <Button variant="ghost" tone="edit" onClick={() => startEdit(c)}>
                          {t("catalogs.edit")}
                        </Button>
                        <Button variant="ghost" tone="delete" onClick={() => void handleDelete(c.id)}>
                          {t("catalogs.delete")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
          </DataTable>
        )}
      </section>

      <p className="section-lead section-lead--next">
        {t("catalogs.nextItems")}{" "}
        <Link to="/items" className="text-link">
          {t("catalogs.linkToItems")}
        </Link>
      </p>
      {showCreateModal ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="catalog-create-title">
          <div className="modal-card">
            <CatalogForm
              newCatalog={newCatalog}
              setNewCatalog={setNewCatalog}
              onCreateCatalog={async (event) => {
                await onCreateCatalog(event);
                closeCreateModal();
              }}
            />
            <div className="row-actions" style={{ marginTop: 12 }}>
              <Button variant="ghost" tone="cancel" onClick={closeCreateModal}>
                {t("catalogs.cancel")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {isEditing ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="catalog-edit-title">
          <form className="panel form modal-card" onSubmit={submitEdit}>
            <h3 id="catalog-edit-title">{t("catalogs.editTitle")}</h3>
            <label className="form-label" htmlFor="catalog-edit-name">
              {t("catalogs.labelName")}
            </label>
            <input
              id="catalog-edit-name"
              value={editingCatalog.name}
              onChange={(event) => setEditingCatalog({ ...editingCatalog, name: event.target.value })}
              required
              minLength={2}
            />
            <label className="form-label" htmlFor="catalog-edit-note">
              {t("catalogs.labelNote")}
            </label>
            <input
              id="catalog-edit-note"
              value={editingCatalog.note}
              onChange={(event) => setEditingCatalog({ ...editingCatalog, note: event.target.value })}
            />
            <div className="row-actions">
              <Button variant="primary" type="submit">
                {t("catalogs.update")}
              </Button>
              <Button variant="ghost" tone="cancel" onClick={cancelEdit}>
                {t("catalogs.cancel")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
