import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { usePagination } from "../hooks/usePagination";
import { DeliveryAgentForm } from "../features/delivery/DeliveryAgentForm";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { useConfirm } from "../components/ui/ConfirmProvider";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(EMPTY_EDIT);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const isEditing = useMemo(() => Boolean(editingDelivery.id), [editingDelivery.id]);
  const filteredDeliveryAgents = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return deliveryAgents;
    return deliveryAgents.filter((delivery) =>
      [delivery.id, delivery.name, delivery.phone, delivery.vehicleType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [deliveryAgents, appliedSearch]);
  const {
    page,
    pageSize,
    paged: pagedDeliveryAgents,
    setPage,
    setPageSize,
  } = usePagination(filteredDeliveryAgents, { resetKey: appliedSearch });

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

  function openCreateModal() {
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
  }

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("deliveryAgents.title")}</h2>
        <p className="section-lead">{t("deliveryAgents.lead")}</p>
      </div>
      <section className="panel entity-list">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{t("deliveryAgents.listTitle")}</h3>
          <Button variant="primary" onClick={openCreateModal}>
            {t("deliveryAgents.new", { defaultValue: "New" })}
          </Button>
        </div>
        {deliveryAgents.length === 0 ? (
          <p className="entity-list-empty">{t("deliveryAgents.empty")}</p>
        ) : (
          <DataTable
            showSearch
            searchValue={searchText}
            onSearchValueChange={setSearchText}
            onSearch={() => setAppliedSearch(searchText)}
            searchPlaceholder={t("deliveryAgents.searchPlaceholder", { defaultValue: "Search delivery agents..." })}
            searchButtonLabel={t("common.search", { defaultValue: "Search" })}
            pagination={{
              page,
              pageSize,
              totalRows: filteredDeliveryAgents.length,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t("deliveryAgents.namePh")}</th>
                  <th>{t("deliveryAgents.phonePh")}</th>
                  <th>{t("deliveryAgents.vehiclePh")}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedDeliveryAgents.map((d) => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td>{d.name}</td>
                    <td>{d.phone}</td>
                    <td>{d.vehicleType}</td>
                    <td>
                      <div className="row-actions">
                        <Button variant="ghost" tone="edit" onClick={() => startEdit(d)}>
                          {t("deliveryAgents.edit")}
                        </Button>
                        <Button variant="ghost" tone="delete" onClick={() => void handleDelete(d.id)}>
                          {t("deliveryAgents.delete")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
          </DataTable>
        )}
      </section>
      {showCreateModal ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delivery-create-title">
          <div className="modal-card">
            <DeliveryAgentForm
              newDelivery={newDelivery}
              setNewDelivery={setNewDelivery}
              onCreateDelivery={async (event) => {
                await onCreateDelivery(event);
                closeCreateModal();
              }}
            />
            <div className="row-actions" style={{ marginTop: 12 }}>
              <Button variant="ghost" tone="cancel" onClick={closeCreateModal}>
                {t("deliveryAgents.cancel")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
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
              <Button variant="primary" type="submit">
                {t("deliveryAgents.update")}
              </Button>
              <Button variant="ghost" tone="cancel" onClick={cancelEdit}>
                {t("deliveryAgents.cancel")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
