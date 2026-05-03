import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { ProducerForm } from "../features/producer/ProducerForm";
import { useConfirm } from "../components/ui/ConfirmProvider";

const EMPTY_EDIT = { id: "", name: "", phone: "", capacityNote: "" };

export function ProducersPage({
  producers,
  newProducer,
  setNewProducer,
  onCreateProducer,
  onUpdateProducer,
  onDeleteProducer,
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProducer, setEditingProducer] = useState(EMPTY_EDIT);
  const isEditing = useMemo(() => Boolean(editingProducer.id), [editingProducer.id]);

  function startEdit(producer) {
    setEditingProducer({
      id: producer.id,
      name: producer.name || "",
      phone: producer.phone || "",
      capacityNote: producer.capacityNote || "",
    });
  }

  function cancelEdit() {
    setEditingProducer(EMPTY_EDIT);
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingProducer.id) return;
    await onUpdateProducer(editingProducer.id, {
      name: editingProducer.name,
      phone: editingProducer.phone,
      capacityNote: editingProducer.capacityNote,
    });
    setEditingProducer(EMPTY_EDIT);
  }

  async function handleDelete(producerId) {
    if (
      !(await confirm({
        title: t("confirm.deleteTitle"),
        message: t("producers.confirmDelete"),
        tone: "danger",
      }))
    ) {
      return;
    }
    if (editingProducer.id === producerId) {
      setEditingProducer(EMPTY_EDIT);
    }
    await onDeleteProducer(producerId);
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
        <h2>{t("producers.title")}</h2>
        <p className="section-lead">{t("producers.lead")}</p>
      </div>
      <section className="panel entity-list">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{t("producers.listTitle")}</h3>
          <button type="button" className="btn-primary" onClick={openCreateModal}>
            {t("producers.new", { defaultValue: "New" })}
          </button>
        </div>
        {producers.length === 0 ? (
          <p className="entity-list-empty">{t("producers.empty")}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t("producers.namePh")}</th>
                  <th>{t("producers.phonePh")}</th>
                  <th>{t("producers.capacityPh")}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {producers.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.phone}</td>
                    <td>{p.capacityNote || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn-ghost btn-edit" onClick={() => startEdit(p)}>
                          {t("producers.edit")}
                        </button>
                        <button type="button" className="btn-ghost btn-delete" onClick={() => void handleDelete(p.id)}>
                          {t("producers.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {showCreateModal ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="producer-create-title">
          <div className="modal-card">
            <ProducerForm
              newProducer={newProducer}
              setNewProducer={setNewProducer}
              onCreateProducer={async (event) => {
                await onCreateProducer(event);
                closeCreateModal();
              }}
            />
            <div className="row-actions" style={{ marginTop: 12 }}>
              <button type="button" className="btn-ghost btn-cancel" onClick={closeCreateModal}>
                {t("producers.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isEditing ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="producer-edit-title">
          <form className="panel form modal-card" onSubmit={submitEdit}>
            <h3 id="producer-edit-title">{t("producers.editTitle")}</h3>
            <label className="form-label" htmlFor="producer-edit-name">
              {t("producers.namePh")}
            </label>
            <input
              id="producer-edit-name"
              value={editingProducer.name}
              onChange={(event) => setEditingProducer({ ...editingProducer, name: event.target.value })}
              required
              minLength={2}
            />
            <label className="form-label" htmlFor="producer-edit-phone">
              {t("producers.phonePh")}
            </label>
            <input
              id="producer-edit-phone"
              value={editingProducer.phone}
              onChange={(event) => setEditingProducer({ ...editingProducer, phone: event.target.value })}
              required
              minLength={5}
            />
            <label className="form-label" htmlFor="producer-edit-capacity">
              {t("producers.capacityPh")}
            </label>
            <input
              id="producer-edit-capacity"
              value={editingProducer.capacityNote}
              onChange={(event) => setEditingProducer({ ...editingProducer, capacityNote: event.target.value })}
            />
            <div className="row-actions">
              <button type="submit" className="btn-primary">
                {t("producers.update")}
              </button>
              <button type="button" className="btn-ghost btn-cancel" onClick={cancelEdit}>
                {t("producers.cancel")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
