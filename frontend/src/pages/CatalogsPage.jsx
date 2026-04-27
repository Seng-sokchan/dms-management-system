import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CatalogForm } from "../components/CatalogForm";
import { useConfirm } from "../components/ConfirmProvider";

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

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("catalogs.pageTitle")}</h2>
        <p className="section-lead">{t("catalogs.pageLead")}</p>
      </div>

      <div className="form-single">
        <CatalogForm
          newCatalog={newCatalog}
          setNewCatalog={setNewCatalog}
          onCreateCatalog={onCreateCatalog}
        />
      </div>

      <section className="panel entity-list">
        <h3>{t("catalogs.listTitle")}</h3>
        {catalogs.length === 0 ? (
          <p className="entity-list-empty">{t("catalogs.empty")}</p>
        ) : (
          <ul className="entity-list-ul">
            {catalogs.map((c) => (
              <li key={c.id} className="entity-list-item">
                <span className="entity-list-name">{c.name}</span>
                {c.note ? <span className="entity-list-note">{c.note}</span> : null}
                <div className="row-actions">
                  <button type="button" className="btn-ghost btn-edit" onClick={() => startEdit(c)}>
                    {t("catalogs.edit")}
                  </button>
                  <button type="button" className="btn-ghost btn-delete" onClick={() => void handleDelete(c.id)}>
                    {t("catalogs.delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="section-lead section-lead--next">
        {t("catalogs.nextItems")}{" "}
        <Link to="/items" className="text-link">
          {t("catalogs.linkToItems")}
        </Link>
      </p>
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
              <button type="submit" className="btn-primary">
                {t("catalogs.update")}
              </button>
              <button type="button" className="btn-ghost btn-cancel" onClick={cancelEdit}>
                {t("catalogs.cancel")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
