import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../hooks/usePagination";
import { DataTable } from "../components/ui/DataTable";
import { Button } from "../components/ui/Button";
import { useConfirm } from "../components/ui/ConfirmProvider";
import { OrderGroupForm } from "../features/orderGroup/OrderGroupForm";

const EMPTY_EDIT = { id: "", name: "" };

export function OrderGroupsPage({
  orderGroups = [],
  newOrderGroup,
  setNewOrderGroup,
  onCreateOrderGroup,
  onUpdateOrderGroup,
  onDeleteOrderGroup,
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrderGroup, setEditingOrderGroup] = useState(EMPTY_EDIT);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const isEditing = useMemo(() => Boolean(editingOrderGroup.id), [editingOrderGroup.id]);

  const filteredOrderGroups = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return orderGroups;
    return orderGroups.filter((orderGroup) =>
      [orderGroup.id, orderGroup.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [orderGroups, appliedSearch]);

  const {
    page,
    pageSize,
    paged: pagedOrderGroups,
    setPage,
    setPageSize,
  } = usePagination(filteredOrderGroups, { resetKey: appliedSearch });

  function startEdit(orderGroup) {
    setEditingOrderGroup({ id: orderGroup.id, name: orderGroup.name || "" });
  }

  function cancelEdit() {
    setEditingOrderGroup(EMPTY_EDIT);
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingOrderGroup.id) return;
    await onUpdateOrderGroup(editingOrderGroup.id, { name: editingOrderGroup.name });
    setEditingOrderGroup(EMPTY_EDIT);
  }

  async function handleDelete(orderGroupId) {
    if (
      !(await confirm({
        title: t("confirm.deleteTitle"),
        message: t("orderGroups.confirmDelete"),
        tone: "danger",
      }))
    ) {
      return;
    }
    if (editingOrderGroup.id === orderGroupId) {
      setEditingOrderGroup(EMPTY_EDIT);
    }
    await onDeleteOrderGroup(orderGroupId);
  }

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("orderGroups.pageTitle")}</h2>
        <p className="section-lead">{t("orderGroups.pageLead")}</p>
      </div>

      <section className="panel entity-list">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{t("orderGroups.listTitle")}</h3>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            {t("orderGroups.new", { defaultValue: "New" })}
          </Button>
        </div>

        {orderGroups.length === 0 ? (
          <p className="entity-list-empty">{t("orderGroups.empty")}</p>
        ) : (
          <DataTable
            showSearch
            searchValue={searchText}
            onSearchValueChange={setSearchText}
            onSearch={() => setAppliedSearch(searchText)}
            searchPlaceholder={t("orderGroups.searchPlaceholder", { defaultValue: "Search order groups..." })}
            searchButtonLabel={t("common.search", { defaultValue: "Search" })}
            pagination={{
              page,
              pageSize,
              totalRows: filteredOrderGroups.length,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("orderGroups.labelName")}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedOrderGroups.map((group) => (
                <tr key={group.id}>
                  <td>{group.id}</td>
                  <td>{group.name || "—"}</td>
                  <td>
                    <div className="row-actions">
                      <Button variant="ghost" tone="edit" onClick={() => startEdit(group)}>
                        {t("orderGroups.edit")}
                      </Button>
                      <Button variant="ghost" tone="delete" onClick={() => void handleDelete(group.id)}>
                        {t("orderGroups.delete")}
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
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="order-group-create-title">
          <div className="modal-card">
            <OrderGroupForm
              newOrderGroup={newOrderGroup}
              setNewOrderGroup={setNewOrderGroup}
              onCreateOrderGroup={async (event) => {
                await onCreateOrderGroup(event);
                setShowCreateModal(false);
              }}
            />
            <div className="row-actions" style={{ marginTop: 12 }}>
              <Button variant="ghost" tone="cancel" onClick={() => setShowCreateModal(false)}>
                {t("orderGroups.cancel")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isEditing ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="order-group-edit-title">
          <form className="panel form modal-card" onSubmit={submitEdit}>
            <h3 id="order-group-edit-title">{t("orderGroups.editTitle")}</h3>
            <label className="form-label" htmlFor="order-group-edit-name">
              {t("orderGroups.labelName")}
            </label>
            <input
              id="order-group-edit-name"
              value={editingOrderGroup.name}
              onChange={(event) => setEditingOrderGroup({ ...editingOrderGroup, name: event.target.value })}
              required
              minLength={2}
            />
            <div className="row-actions">
              <Button variant="primary" type="submit">
                {t("orderGroups.update")}
              </Button>
              <Button variant="ghost" tone="cancel" onClick={cancelEdit}>
                {t("orderGroups.cancel")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
