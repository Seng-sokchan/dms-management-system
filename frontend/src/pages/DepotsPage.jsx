import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { useConfirm } from "../components/ui/ConfirmProvider";
import { DepotCreatePopupForm, DepotEditPopupForm } from "../features/depot/DepotForm";
import "../features/depot/depots.css";
import { canManageMenuKey } from "../constants/menus";
import { usePagination } from "../hooks/usePagination";

const EMPTY_EDIT = {
  id: "",
  name: "",
  phone: "",
  address: "",
  depotUserId: "",
};

export function DepotsPage({
  depots,
  users = [],
  user,
  newDepot,
  setNewDepot,
  onCreateDepot,
  onUpdateDepot,
  onDeleteDepot,
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const canManageDepots = canManageMenuKey(user, "depots");

  const [depotSearchText, setDepotSearchText] = useState("");
  const [depotAppliedSearch, setDepotAppliedSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDepot, setEditingDepot] = useState(EMPTY_EDIT);
  const isEditing = useMemo(() => Boolean(editingDepot.id), [editingDepot.id]);
  const filteredDepots = useMemo(() => {
    const keyword = depotAppliedSearch.trim().toLowerCase();
    if (!keyword) return depots;
    return depots.filter((depot) =>
      [depot.id, depot.name, depot.phone, depot.address, depot.depotUserName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [depots, depotAppliedSearch]);
  const {
    page: depotListPage,
    pageSize: depotListPageSize,
    paged: pagedDepots,
    setPage: setDepotListPage,
    setPageSize: setDepotListPageSize,
  } = usePagination(filteredDepots, { resetKey: depotAppliedSearch });

  function startEdit(depot) {
    setEditingDepot({
      id: depot.id,
      name: depot.name || "",
      phone: depot.phone || "",
      address: depot.address || "",
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
      depotUserId: editingDepot.depotUserId.trim() === "" ? null : editingDepot.depotUserId.trim(),
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
            <Button variant="primary" onClick={openCreateModal}>
              {t("depots.new", { defaultValue: "New" })}
            </Button>
          ) : null}
        </div>
        {depots.length === 0 ? (
          <p className="entity-list-empty">{t("depots.empty")}</p>
        ) : (
          <DataTable
            showSearch
            searchValue={depotSearchText}
            onSearchValueChange={setDepotSearchText}
            onSearch={() => setDepotAppliedSearch(depotSearchText)}
            searchPlaceholder={t("depots.searchPlaceholder", { defaultValue: "Search depots..." })}
            searchButtonLabel={t("common.search", { defaultValue: "Search" })}
            pagination={{
              page: depotListPage,
              pageSize: depotListPageSize,
              totalRows: filteredDepots.length,
              onPageChange: setDepotListPage,
              onPageSizeChange: setDepotListPageSize,
            }}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("depots.name")}</th>
                <th>{t("depots.phone")}</th>
                <th>{t("depots.address")}</th>
                <th>{t("depots.depotUser")}</th>
                {canManageDepots ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {pagedDepots.map((depot) => (
                <tr key={depot.id}>
                  <td>{depot.id}</td>
                  <td>{depot.name}</td>
                  <td>{depot.phone || "—"}</td>
                  <td>{depot.address || "—"}</td>
                  <td>{depot.depotUserName || "—"}</td>
                  {canManageDepots ? (
                    <td>
                      <div className="row-actions">
                        <Button variant="ghost" tone="edit" onClick={() => startEdit(depot)}>
                          {t("depots.edit")}
                        </Button>
                        <Button variant="ghost" tone="delete" onClick={() => void handleDelete(depot.id)}>
                          {t("depots.delete")}
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </section>

      <DepotCreatePopupForm
        open={showCreateModal}
        users={users}
        newDepot={newDepot}
        setNewDepot={setNewDepot}
        onCreateDepot={onCreateDepot}
        onClose={closeCreateModal}
      />

      <DepotEditPopupForm
        open={isEditing}
        users={users}
        editingDepot={editingDepot}
        setEditingDepot={setEditingDepot}
        onSubmitEdit={submitEdit}
        onClose={cancelEdit}
      />
    </section>
  );
}
