import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { useConfirm } from "../components/ui/ConfirmProvider";
import { ProvinceForm } from "../features/province/ProvinceForm";
import { usePagination } from "../hooks/usePagination";

const EMPTY_EDIT = { id: "", name: "" };

export function ProvincesPage({
  provinces = [],
  newProvince,
  setNewProvince,
  onCreateProvince,
  onUpdateProvince,
  onDeleteProvince,
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProvince, setEditingProvince] = useState(EMPTY_EDIT);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const isEditing = useMemo(() => Boolean(editingProvince.id), [editingProvince.id]);
  const filteredProvinces = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return provinces;
    return provinces.filter((province) =>
      [province.id, province.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [provinces, appliedSearch]);
  const {
    page,
    pageSize,
    paged: pagedProvinces,
    setPage,
    setPageSize,
  } = usePagination(filteredProvinces, { resetKey: appliedSearch });

  function startEdit(province) {
    setEditingProvince({ id: province.id, name: province.name || "" });
  }

  function cancelEdit() {
    setEditingProvince(EMPTY_EDIT);
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingProvince.id) return;
    await onUpdateProvince(editingProvince.id, { name: editingProvince.name });
    setEditingProvince(EMPTY_EDIT);
  }

  async function handleDelete(provinceId) {
    if (
      !(await confirm({
        title: t("confirm.deleteTitle"),
        message: t("provinces.confirmDelete"),
        tone: "danger",
      }))
    ) {
      return;
    }
    if (editingProvince.id === provinceId) {
      setEditingProvince(EMPTY_EDIT);
    }
    await onDeleteProvince(provinceId);
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
        <h2>{t("provinces.title")}</h2>
        <p className="section-lead">{t("provinces.lead")}</p>
      </div>

      <section className="panel entity-list">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{t("provinces.listTitle")}</h3>
          <Button variant="primary" onClick={openCreateModal}>
            {t("provinces.new", { defaultValue: "New" })}
          </Button>
        </div>
        {provinces.length === 0 ? (
          <p className="entity-list-empty">{t("provinces.empty")}</p>
        ) : (
          <DataTable
            showSearch
            searchValue={searchText}
            onSearchValueChange={setSearchText}
            onSearch={() => setAppliedSearch(searchText)}
            searchPlaceholder={t("provinces.searchPlaceholder", { defaultValue: "Search provinces..." })}
            searchButtonLabel={t("common.search", { defaultValue: "Search" })}
            pagination={{
              page,
              pageSize,
              totalRows: filteredProvinces.length,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("provinces.name")}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedProvinces.map((province) => (
                <tr key={province.id}>
                  <td>{province.id}</td>
                  <td>{province.name}</td>
                  <td>
                    <div className="row-actions">
                      <Button variant="ghost" tone="edit" onClick={() => startEdit(province)}>
                        {t("provinces.edit")}
                      </Button>
                      <Button variant="ghost" tone="delete" onClick={() => void handleDelete(province.id)}>
                        {t("provinces.delete")}
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
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="province-create-title">
          <div className="modal-card">
            <ProvinceForm
              newProvince={newProvince}
              setNewProvince={setNewProvince}
              onCreateProvince={async (event) => {
                await onCreateProvince(event);
                closeCreateModal();
              }}
            />
            <div className="row-actions" style={{ marginTop: 12 }}>
              <Button variant="ghost" tone="cancel" onClick={closeCreateModal}>
                {t("provinces.cancel")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isEditing ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="province-edit-title">
          <form className="panel form modal-card" onSubmit={submitEdit}>
            <h3 id="province-edit-title">{t("provinces.editTitle")}</h3>
            <label className="form-label" htmlFor="province-edit-name">
              {t("provinces.name")}
            </label>
            <input
              id="province-edit-name"
              value={editingProvince.name}
              onChange={(event) => setEditingProvince({ ...editingProvince, name: event.target.value })}
              required
              minLength={2}
            />
            <div className="row-actions">
              <Button variant="primary" type="submit">
                {t("provinces.update")}
              </Button>
              <Button variant="ghost" tone="cancel" onClick={cancelEdit}>
                {t("provinces.cancel")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
