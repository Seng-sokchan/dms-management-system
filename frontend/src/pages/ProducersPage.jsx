import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { usePagination } from "../hooks/usePagination";
import { ProducerForm } from "../features/producer/ProducerForm";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { FormModal } from "../components/ui/FormModal";
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
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const isEditing = useMemo(() => Boolean(editingProducer.id), [editingProducer.id]);
  const filteredProducers = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return producers;
    return producers.filter((producer) =>
      [producer.id, producer.name, producer.phone, producer.capacityNote]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [producers, appliedSearch]);
  const {
    page,
    pageSize,
    paged: pagedProducers,
    setPage,
    setPageSize,
  } = usePagination(filteredProducers, { resetKey: appliedSearch });

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
          <Button variant="primary" onClick={openCreateModal}>
            {t("producers.new", { defaultValue: "New" })}
          </Button>
        </div>
        {producers.length === 0 ? (
          <p className="entity-list-empty">{t("producers.empty")}</p>
        ) : (
          <DataTable
            showSearch
            searchValue={searchText}
            onSearchValueChange={setSearchText}
            onSearch={() => setAppliedSearch(searchText)}
            searchPlaceholder={t("producers.searchPlaceholder", { defaultValue: "Search producers..." })}
            searchButtonLabel={t("common.search", { defaultValue: "Search" })}
            pagination={{
              page,
              pageSize,
              totalRows: filteredProducers.length,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          >
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
                {pagedProducers.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.phone}</td>
                    <td>{p.capacityNote || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <Button variant="ghost" tone="edit" onClick={() => startEdit(p)}>
                          {t("producers.edit")}
                        </Button>
                        <Button variant="ghost" tone="delete" onClick={() => void handleDelete(p.id)}>
                          {t("producers.delete")}
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
        title={t("producers.formTitle")}
        titleId="producer-create-title"
        size="md"
        onClose={closeCreateModal}
        footer={
          <div className="row-actions">
            <Button variant="ghost" tone="cancel" onClick={closeCreateModal}>
              {t("producers.cancel")}
            </Button>
            <Button variant="primary" type="submit" form="producer-create-form">
              {t("producers.save")}
            </Button>
          </div>
        }
      >
        <ProducerForm
          mode="create"
          formId="producer-create-form"
          value={newProducer}
          onChange={setNewProducer}
          onSubmit={async (event) => {
            await onCreateProducer(event);
            closeCreateModal();
          }}
        />
      </FormModal>
      <FormModal
        open={isEditing}
        title={t("producers.editTitle")}
        titleId="producer-edit-title"
        size="md"
        onClose={cancelEdit}
        footer={
          <div className="row-actions">
            <Button variant="ghost" tone="cancel" onClick={cancelEdit}>
              {t("producers.cancel")}
            </Button>
            <Button variant="primary" type="submit" form="producer-edit-form">
              {t("producers.update")}
            </Button>
          </div>
        }
      >
        <ProducerForm
          mode="edit"
          formId="producer-edit-form"
          value={editingProducer}
          onChange={setEditingProducer}
          onSubmit={submitEdit}
        />
      </FormModal>
    </section>
  );
}
