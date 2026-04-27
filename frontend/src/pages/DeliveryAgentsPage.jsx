import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { DeliveryAgentForm } from "../components/DeliveryAgentForm";
import { useConfirm } from "../components/ConfirmProvider";

const EMPTY_EDIT = { id: "", name: "", phone: "", vehicleType: "" };

export function DeliveryAgentsPage({
  deliveryAgents,
  newDelivery,
  setNewDelivery,
  onCreateDelivery,
  onUpdateDelivery,
  onDeleteDelivery,
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [editingDelivery, setEditingDelivery] = useState(EMPTY_EDIT);
  const isEditing = useMemo(() => Boolean(editingDelivery.id), [editingDelivery.id]);

  function startEdit(deliveryAgent) {
    setEditingDelivery({
      id: deliveryAgent.id,
      name: deliveryAgent.name || "",
      phone: deliveryAgent.phone || "",
      vehicleType: deliveryAgent.vehicleType || "",
    });
  }

  function cancelEdit() {
    setEditingDelivery(EMPTY_EDIT);
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingDelivery.id) return;
    await onUpdateDelivery(editingDelivery.id, {
      name: editingDelivery.name,
      phone: editingDelivery.phone,
      vehicleType: editingDelivery.vehicleType,
    });
    setEditingDelivery(EMPTY_EDIT);
  }

  async function handleDelete(deliveryId) {
    if (
      !(await confirm({
        title: t("confirm.deleteTitle"),
        message: t("deliveryAgents.confirmDelete"),
        tone: "danger",
      }))
    ) {
      return;
    }
    if (editingDelivery.id === deliveryId) {
      setEditingDelivery(EMPTY_EDIT);
    }
    await onDeleteDelivery(deliveryId);
  }

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("deliveryAgents.title")}</h2>
        <p className="section-lead">{t("deliveryAgents.lead")}</p>
      </div>
      <div className="form-single">
        <DeliveryAgentForm
          newDelivery={newDelivery}
          setNewDelivery={setNewDelivery}
          onCreateDelivery={onCreateDelivery}
        />
      </div>
      <section className="panel entity-list">
        <h3>{t("deliveryAgents.listTitle")}</h3>
        {deliveryAgents.length === 0 ? (
          <p className="entity-list-empty">{t("deliveryAgents.empty")}</p>
        ) : (
          <ul className="entity-list-ul">
            {deliveryAgents.map((d) => (
              <li key={d.id} className="entity-list-item">
                <span className="entity-list-name">{d.name}</span>
                <span className="entity-list-meta">
                  {d.phone} · {d.vehicleType}
                </span>
                <div className="row-actions">
                  <button type="button" className="btn-ghost btn-edit" onClick={() => startEdit(d)}>
                    {t("deliveryAgents.edit")}
                  </button>
                  <button type="button" className="btn-ghost btn-delete" onClick={() => void handleDelete(d.id)}>
                    {t("deliveryAgents.delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      {isEditing ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delivery-edit-title">
          <form className="panel form modal-card" onSubmit={submitEdit}>
            <h3 id="delivery-edit-title">{t("deliveryAgents.editTitle")}</h3>
            <label className="form-label" htmlFor="delivery-edit-name">
              {t("deliveryAgents.namePh")}
            </label>
            <input
              id="delivery-edit-name"
              value={editingDelivery.name}
              onChange={(event) => setEditingDelivery({ ...editingDelivery, name: event.target.value })}
              required
              minLength={2}
            />
            <label className="form-label" htmlFor="delivery-edit-phone">
              {t("deliveryAgents.phonePh")}
            </label>
            <input
              id="delivery-edit-phone"
              value={editingDelivery.phone}
              onChange={(event) => setEditingDelivery({ ...editingDelivery, phone: event.target.value })}
              required
              minLength={5}
            />
            <label className="form-label" htmlFor="delivery-edit-vehicle">
              {t("deliveryAgents.vehiclePh")}
            </label>
            <input
              id="delivery-edit-vehicle"
              value={editingDelivery.vehicleType}
              onChange={(event) => setEditingDelivery({ ...editingDelivery, vehicleType: event.target.value })}
              required
              minLength={2}
            />
            <div className="row-actions">
              <button type="submit" className="btn-primary">
                {t("deliveryAgents.update")}
              </button>
              <button type="button" className="btn-ghost btn-cancel" onClick={cancelEdit}>
                {t("deliveryAgents.cancel")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
