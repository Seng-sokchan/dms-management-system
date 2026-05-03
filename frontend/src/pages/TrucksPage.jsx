import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../components/ui/ConfirmProvider";

const EMPTY_EDIT = { id: "", code: "", plateNo: "", deliveryAgentId: "", capacityNote: "" };

export function TrucksPage({
  trucks = [],
  deliveryAgents = [],
  newTruck,
  setNewTruck,
  onCreateTruck,
  onUpdateTruck,
  onDeleteTruck,
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTruck, setEditingTruck] = useState(EMPTY_EDIT);
  const isEditing = useMemo(() => Boolean(editingTruck.id), [editingTruck.id]);

  async function handleCreateTruck(event) {
    await onCreateTruck(event);
  }

  function startEdit(truck) {
    setEditingTruck({
      id: truck.id,
      code: truck.code || "",
      plateNo: truck.plateNo || "",
      deliveryAgentId: truck.deliveryAgentId || "",
      capacityNote: truck.capacityNote || "",
    });
  }

  function cancelEdit() {
    setEditingTruck(EMPTY_EDIT);
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingTruck.id) return;
    await onUpdateTruck(editingTruck.id, {
      code: editingTruck.code,
      plateNo: editingTruck.plateNo,
      deliveryAgentId: editingTruck.deliveryAgentId || "",
      capacityNote: editingTruck.capacityNote,
    });
    setEditingTruck(EMPTY_EDIT);
  }

  async function handleDelete(truckId) {
    if (
      !(await confirm({
        title: t("confirm.deleteTitle"),
        message: t("trucks.confirmDelete"),
        tone: "danger",
      }))
    ) {
      return;
    }
    if (editingTruck.id === truckId) {
      setEditingTruck(EMPTY_EDIT);
    }
    await onDeleteTruck(truckId);
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
        <h2>{t("trucks.title")}</h2>
        <p className="section-lead">{t("trucks.lead")}</p>
      </div>
      <section className="panel entity-list">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{t("trucks.listTitle")}</h3>
          <button type="button" className="btn-primary" onClick={openCreateModal}>
            {t("trucks.new", { defaultValue: "New" })}
          </button>
        </div>
        {trucks.length === 0 ? (
          <p className="entity-list-empty">{t("trucks.empty")}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t("trucks.code")}</th>
                  <th>{t("trucks.plateNo")}</th>
                  <th>{t("trucks.deliveryAgent")}</th>
                  <th>{t("trucks.capacityNote")}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trucks.map((truck) => (
                  <tr key={truck.id}>
                    <td>{truck.id}</td>
                    <td>{truck.code}</td>
                    <td>{truck.plateNo}</td>
                    <td>{truck.deliveryAgentName || t("orders.dash")}</td>
                    <td>{truck.capacityNote || t("orders.dash")}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn-ghost btn-edit" onClick={() => startEdit(truck)}>{t("trucks.edit")}</button>
                        <button type="button" className="btn-ghost btn-delete" onClick={() => void handleDelete(truck.id)}>{t("trucks.delete")}</button>
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
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="truck-create-title">
          <form className="panel form modal-card" onSubmit={async (event) => {
            await handleCreateTruck(event);
            closeCreateModal();
          }}>
            <h3 id="truck-create-title">{t("trucks.formTitle")}</h3>
            <label className="form-label" htmlFor="truck-code">{t("trucks.code")}</label>
            <input id="truck-code" value={newTruck.code} onChange={(e) => setNewTruck({ ...newTruck, code: e.target.value })} required minLength={2} />
            <label className="form-label" htmlFor="truck-plate">{t("trucks.plateNo")}</label>
            <input id="truck-plate" value={newTruck.plateNo} onChange={(e) => setNewTruck({ ...newTruck, plateNo: e.target.value })} required minLength={3} />
            <label className="form-label" htmlFor="truck-delivery-agent">{t("trucks.deliveryAgent")}</label>
            <select
              id="truck-delivery-agent"
              value={newTruck.deliveryAgentId || ""}
              onChange={(e) => setNewTruck({ ...newTruck, deliveryAgentId: e.target.value })}
              required
            >
              <option value="">{t("createOrder.none")}</option>
              {deliveryAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.vehicleType})
                </option>
              ))}
            </select>
            <label className="form-label" htmlFor="truck-capacity">{t("trucks.capacityNote")}</label>
            <input id="truck-capacity" value={newTruck.capacityNote} onChange={(e) => setNewTruck({ ...newTruck, capacityNote: e.target.value })} />
            <div className="row-actions">
              <button type="submit" className="btn-primary">{t("trucks.save")}</button>
              <button type="button" className="btn-ghost btn-cancel" onClick={closeCreateModal}>{t("trucks.cancel")}</button>
            </div>
          </form>
        </div>
      ) : null}
      {isEditing ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="truck-edit-title">
          <form className="panel form modal-card" onSubmit={submitEdit}>
            <h3 id="truck-edit-title">{t("trucks.editTitle")}</h3>
            <label className="form-label" htmlFor="truck-edit-code">{t("trucks.code")}</label>
            <input id="truck-edit-code" value={editingTruck.code} onChange={(e) => setEditingTruck({ ...editingTruck, code: e.target.value })} required minLength={2} />
            <label className="form-label" htmlFor="truck-edit-plate">{t("trucks.plateNo")}</label>
            <input id="truck-edit-plate" value={editingTruck.plateNo} onChange={(e) => setEditingTruck({ ...editingTruck, plateNo: e.target.value })} required minLength={3} />
            <label className="form-label" htmlFor="truck-edit-delivery-agent">{t("trucks.deliveryAgent")}</label>
            <select
              id="truck-edit-delivery-agent"
              value={editingTruck.deliveryAgentId || ""}
              onChange={(e) => setEditingTruck({ ...editingTruck, deliveryAgentId: e.target.value })}
              required
            >
              <option value="">{t("createOrder.none")}</option>
              {deliveryAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.vehicleType})
                </option>
              ))}
            </select>
            <label className="form-label" htmlFor="truck-edit-capacity">{t("trucks.capacityNote")}</label>
            <input id="truck-edit-capacity" value={editingTruck.capacityNote} onChange={(e) => setEditingTruck({ ...editingTruck, capacityNote: e.target.value })} />
            <div className="row-actions">
              <button type="submit" className="btn-primary">{t("trucks.update")}</button>
              <button type="button" className="btn-ghost btn-cancel" onClick={cancelEdit}>{t("trucks.cancel")}</button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
