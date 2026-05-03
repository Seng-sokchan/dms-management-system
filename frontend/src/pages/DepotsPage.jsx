import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../components/ui/ConfirmProvider";

const EMPTY_EDIT = {
  id: "",
  name: "",
  phone: "",
  address: "",
  ownerUserId: "",
  depotUserId: "",
};

export function DepotsPage({
  depots,
  user,
  newDepot,
  setNewDepot,
  onCreateDepot,
  onUpdateDepot,
  onDeleteDepot,
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const canManageDepots = user?.role === "Admin" || user?.role === "Owner";
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDepot, setEditingDepot] = useState(EMPTY_EDIT);
  const isEditing = useMemo(() => Boolean(editingDepot.id), [editingDepot.id]);

  function startEdit(depot) {
    setEditingDepot({
      id: depot.id,
      name: depot.name || "",
      phone: depot.phone || "",
      address: depot.address || "",
      ownerUserId: depot.ownerUserId || "",
      depotUserId: depot.depotUserId || "",
    });
  }

  function cancelEdit() {
    setEditingDepot(EMPTY_EDIT);
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingDepot.id) return;
    await onUpdateDepot(editingDepot.id, {
      name: editingDepot.name,
      phone: editingDepot.phone,
      address: editingDepot.address,
      ownerUserId: editingDepot.ownerUserId || undefined,
      depotUserId: editingDepot.depotUserId || undefined,
    });
    setEditingDepot(EMPTY_EDIT);
  }

  async function handleDelete(depotId) {
    if (
      !(await confirm({
        title: t("confirm.deleteTitle"),
        message: t("depots.confirmDelete"),
        tone: "danger",
      }))
    ) {
      return;
    }
    if (editingDepot.id === depotId) {
      setEditingDepot(EMPTY_EDIT);
    }
    await onDeleteDepot(depotId);
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
        <h2>{t("depots.title")}</h2>
        <p className="section-lead">{t("depots.lead")}</p>
      </div>

      <section className="panel entity-list">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>{t("depots.listTitle")}</h3>
          {canManageDepots ? (
            <button type="button" className="btn-primary" onClick={openCreateModal}>
              {t("depots.new", { defaultValue: "New" })}
            </button>
          ) : null}
        </div>
        {depots.length === 0 ? (
          <p className="entity-list-empty">{t("depots.empty")}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t("depots.name")}</th>
                  <th>{t("depots.phone")}</th>
                  <th>{t("depots.address")}</th>
                  <th>{t("depots.owner")}</th>
                  <th>{t("depots.depotUser")}</th>
                  {canManageDepots ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {depots.map((depot) => (
                  <tr key={depot.id}>
                    <td>{depot.id}</td>
                    <td>{depot.name}</td>
                    <td>{depot.phone || "—"}</td>
                    <td>{depot.address || "—"}</td>
                    <td>{depot.ownerUserName || "—"}</td>
                    <td>{depot.depotUserName || "—"}</td>
                    {canManageDepots ? (
                      <td>
                        <div className="row-actions">
                          <button type="button" className="btn-ghost btn-edit" onClick={() => startEdit(depot)}>
                            {t("depots.edit")}
                          </button>
                          <button type="button" className="btn-ghost btn-delete" onClick={() => void handleDelete(depot.id)}>
                            {t("depots.delete")}
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showCreateModal ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="depot-create-title">
          <form
            className="panel form modal-card"
            onSubmit={async (event) => {
              await onCreateDepot(event);
              closeCreateModal();
            }}
          >
            <h3 id="depot-create-title">{t("depots.formTitle")}</h3>
            <label className="form-label" htmlFor="depot-name">{t("depots.name")}</label>
            <input
              id="depot-name"
              value={newDepot.name}
              onChange={(event) => setNewDepot((prev) => ({ ...prev, name: event.target.value }))}
              required
              minLength={2}
            />
            <label className="form-label" htmlFor="depot-phone">{t("depots.phone")}</label>
            <input
              id="depot-phone"
              value={newDepot.phone}
              onChange={(event) => setNewDepot((prev) => ({ ...prev, phone: event.target.value }))}
            />
            <label className="form-label" htmlFor="depot-address">{t("depots.address")}</label>
            <input
              id="depot-address"
              value={newDepot.address}
              onChange={(event) => setNewDepot((prev) => ({ ...prev, address: event.target.value }))}
            />
            {user?.role === "Admin" ? (
              <>
                <label className="form-label" htmlFor="depot-owner-user-id">{t("depots.ownerUserId")}</label>
                <input
                  id="depot-owner-user-id"
                  value={newDepot.ownerUserId}
                  onChange={(event) => setNewDepot((prev) => ({ ...prev, ownerUserId: event.target.value }))}
                  required
                />
              </>
            ) : null}
            <label className="form-label" htmlFor="depot-depot-user-id">{t("depots.depotUserId")}</label>
            <input
              id="depot-depot-user-id"
              value={newDepot.depotUserId}
              onChange={(event) => setNewDepot((prev) => ({ ...prev, depotUserId: event.target.value }))}
              placeholder={t("depots.depotUserPlaceholder")}
            />
            <div className="row-actions">
              <button type="submit" className="btn-primary">{t("depots.save")}</button>
              <button type="button" className="btn-ghost btn-cancel" onClick={closeCreateModal}>
                {t("depots.cancel")}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {isEditing ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="depot-edit-title">
          <form className="panel form modal-card" onSubmit={submitEdit}>
            <h3 id="depot-edit-title">{t("depots.editTitle")}</h3>
            <label className="form-label" htmlFor="depot-edit-name">{t("depots.name")}</label>
            <input
              id="depot-edit-name"
              value={editingDepot.name}
              onChange={(event) => setEditingDepot((prev) => ({ ...prev, name: event.target.value }))}
              required
              minLength={2}
            />
            <label className="form-label" htmlFor="depot-edit-phone">{t("depots.phone")}</label>
            <input
              id="depot-edit-phone"
              value={editingDepot.phone}
              onChange={(event) => setEditingDepot((prev) => ({ ...prev, phone: event.target.value }))}
            />
            <label className="form-label" htmlFor="depot-edit-address">{t("depots.address")}</label>
            <input
              id="depot-edit-address"
              value={editingDepot.address}
              onChange={(event) => setEditingDepot((prev) => ({ ...prev, address: event.target.value }))}
            />
            {user?.role === "Admin" ? (
              <>
                <label className="form-label" htmlFor="depot-edit-owner-user-id">{t("depots.ownerUserId")}</label>
                <input
                  id="depot-edit-owner-user-id"
                  value={editingDepot.ownerUserId}
                  onChange={(event) => setEditingDepot((prev) => ({ ...prev, ownerUserId: event.target.value }))}
                  required
                />
              </>
            ) : null}
            <label className="form-label" htmlFor="depot-edit-depot-user-id">{t("depots.depotUserId")}</label>
            <input
              id="depot-edit-depot-user-id"
              value={editingDepot.depotUserId}
              onChange={(event) => setEditingDepot((prev) => ({ ...prev, depotUserId: event.target.value }))}
            />
            <div className="row-actions">
              <button type="submit" className="btn-primary">{t("depots.update")}</button>
              <button type="button" className="btn-ghost btn-cancel" onClick={cancelEdit}>{t("depots.cancel")}</button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
