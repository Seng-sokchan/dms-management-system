import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { usePagination } from "../hooks/usePagination";
import { DeliveryAgentForm } from "../features/delivery/DeliveryAgentForm";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { FormModal } from "../components/ui/FormModal";
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
      <FormModal
        open={showCreateModal}
        title={t("deliveryAgents.formTitle")}
        titleId="delivery-create-title"
        size="md"
        onClose={closeCreateModal}
        footer={
          <div className="row-actions">
            <Button variant="ghost" tone="cancel" onClick={closeCreateModal}>
              {t("deliveryAgents.cancel")}
            </Button>
            <Button variant="primary" type="submit" form="delivery-create-form">
              {t("deliveryAgents.save")}
            </Button>
          </div>
        }
      >
        <DeliveryAgentForm
          mode="create"
          formId="delivery-create-form"
          value={newDelivery}
          onChange={setNewDelivery}
          onSubmit={async (event) => {
            await onCreateDelivery(event);
            closeCreateModal();
          }}
        />
      </FormModal>
      <FormModal
        open={isEditing}
        title={t("deliveryAgents.editTitle")}
        titleId="delivery-edit-title"
        size="md"
        onClose={cancelEdit}
        footer={
          <div className="row-actions">
            <Button variant="ghost" tone="cancel" onClick={cancelEdit}>
              {t("deliveryAgents.cancel")}
            </Button>
            <Button variant="primary" type="submit" form="delivery-edit-form">
              {t("deliveryAgents.update")}
            </Button>
          </div>
        }
      >
        <DeliveryAgentForm
          mode="edit"
          formId="delivery-edit-form"
          value={editingDelivery}
          onChange={setEditingDelivery}
          onSubmit={submitEdit}
        />
      </FormModal>
    </section>
  );
}
