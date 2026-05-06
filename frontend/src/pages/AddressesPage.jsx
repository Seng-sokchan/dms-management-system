import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { usePagination } from "../hooks/usePagination";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { useConfirm } from "../components/ui/ConfirmProvider";

const EMPTY_EDIT = { id: "", name: "" };

export function AddressesPage({
  addresses = [],
  newAddress,
  setNewAddress,
  onCreateAddress,
  onUpdateAddress,
  onDeleteAddress,
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(EMPTY_EDIT);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const isEditing = useMemo(() => Boolean(editingAddress.id), [editingAddress.id]);
  const filteredAddresses = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return addresses;
    return addresses.filter((address) =>
      [address.id, address.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [addresses, appliedSearch]);
  const {
    page,
    pageSize,
    paged: pagedAddresses,
    setPage,
    setPageSize,
  } = usePagination(filteredAddresses, { resetKey: appliedSearch });

  function startEdit(address) {
    setEditingAddress({ id: address.id, name: address.name || "" });
  }

  function cancelEdit() {
    setEditingAddress(EMPTY_EDIT);
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingAddress.id) return;
    await onUpdateAddress(editingAddress.id, { name: editingAddress.name });
    setEditingAddress(EMPTY_EDIT);
  }

  async function handleDelete(addressId) {
    if (
      !(await confirm({
        title: t("confirm.deleteTitle"),
        message: t("addresses.confirmDelete", { defaultValue: "Delete this address?" }),
        tone: "danger",
      }))
    ) {
      return;
    }
    if (editingAddress.id === addressId) {
      setEditingAddress(EMPTY_EDIT);
    }
    await onDeleteAddress(addressId);
  }

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("addresses.title", { defaultValue: "Addresses" })}</h2>
        <p className="section-lead">
          {t("addresses.lead", { defaultValue: "Manage address groups used by customers and orders." })}
        </p>
      </div>

      <section className="panel entity-list">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{t("addresses.listTitle", { defaultValue: "Address list" })}</h3>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            {t("addresses.new", { defaultValue: "New" })}
          </Button>
        </div>
        {addresses.length === 0 ? (
          <p className="entity-list-empty">{t("addresses.empty", { defaultValue: "No addresses found." })}</p>
        ) : (
          <DataTable
            showSearch
            searchValue={searchText}
            onSearchValueChange={setSearchText}
            onSearch={() => setAppliedSearch(searchText)}
            searchPlaceholder={t("addresses.searchPlaceholder", { defaultValue: "Search addresses..." })}
            searchButtonLabel={t("common.search", { defaultValue: "Search" })}
            pagination={{
              page,
              pageSize,
              totalRows: filteredAddresses.length,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("addresses.name", { defaultValue: "Name" })}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedAddresses.map((address) => (
                <tr key={address.id}>
                  <td>{address.id}</td>
                  <td>{address.name}</td>
                  <td>
                    <div className="row-actions">
                      <Button variant="ghost" tone="edit" onClick={() => startEdit(address)}>
                        {t("addresses.edit", { defaultValue: "Edit" })}
                      </Button>
                      <Button variant="ghost" tone="delete" onClick={() => void handleDelete(address.id)}>
                        {t("addresses.delete", { defaultValue: "Delete" })}
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
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="address-create-title">
          <form
            className="panel form modal-card"
            onSubmit={async (event) => {
              await onCreateAddress(event);
              setShowCreateModal(false);
            }}
          >
            <h3 id="address-create-title">{t("addresses.formTitle", { defaultValue: "Add address" })}</h3>
            <label className="form-label" htmlFor="address-create-name">
              {t("addresses.name", { defaultValue: "Name" })}
            </label>
            <input
              id="address-create-name"
              value={newAddress?.name || ""}
              onChange={(event) => setNewAddress({ name: event.target.value })}
              required
              minLength={2}
            />
            <div className="row-actions">
              <Button variant="primary" type="submit">
                {t("addresses.save", { defaultValue: "Save address" })}
              </Button>
              <Button variant="ghost" tone="cancel" onClick={() => setShowCreateModal(false)}>
                {t("addresses.cancel", { defaultValue: "Cancel" })}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {isEditing ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="address-edit-title">
          <form className="panel form modal-card" onSubmit={submitEdit}>
            <h3 id="address-edit-title">{t("addresses.editTitle", { defaultValue: "Edit address" })}</h3>
            <label className="form-label" htmlFor="address-edit-name">
              {t("addresses.name", { defaultValue: "Name" })}
            </label>
            <input
              id="address-edit-name"
              value={editingAddress.name}
              onChange={(event) => setEditingAddress({ ...editingAddress, name: event.target.value })}
              required
              minLength={2}
            />
            <div className="row-actions">
              <Button variant="primary" type="submit">
                {t("addresses.update", { defaultValue: "Update address" })}
              </Button>
              <Button variant="ghost" tone="cancel" onClick={cancelEdit}>
                {t("addresses.cancel", { defaultValue: "Cancel" })}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
