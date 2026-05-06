import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { usePagination } from "../hooks/usePagination";
import { CustomerForm } from "../features/customer/CustomerForm";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { useConfirm } from "../components/ui/ConfirmProvider";

const EMPTY_EDIT = { id: "", name: "", phone: "", address: "", userId: "", depotId: "" };

export function CustomersPage({
  customers,
  customerUsers,
  addresses,
  depots = [],
  newCustomer,
  setNewCustomer,
  onCreateCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(EMPTY_EDIT);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const isEditing = useMemo(() => Boolean(editingCustomer.id), [editingCustomer.id]);
  const filteredCustomers = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return customers;
    return customers.filter((customer) =>
      [
        customer.id,
        customer.name,
        customer.phone,
        customer.userName,
        customer.userUsername,
        customer.depotName,
        customer.addressName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [customers, appliedSearch]);
  const {
    page: customerPage,
    pageSize: customerPageSize,
    paged: pagedCustomers,
    setPage: setCustomerPage,
    setPageSize: setCustomerPageSize,
  } = usePagination(filteredCustomers, { resetKey: appliedSearch });

  function startEdit(customer) {
    setEditingCustomer({
      id: customer.id,
      name: customer.name || "",
      phone: customer.phone ?? "",
      address: customer.address || "",
      userId: customer.userId || "",
      depotId: customer.depotId || "",
    });
  }

  function cancelEdit() {
    setEditingCustomer(EMPTY_EDIT);
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingCustomer.id) return;
    await onUpdateCustomer(editingCustomer.id, {
      name: editingCustomer.name,
      phone: editingCustomer.phone,
      address: editingCustomer.address,
      userId: editingCustomer.userId,
      depotId: editingCustomer.depotId,
    });
    setEditingCustomer(EMPTY_EDIT);
  }

  async function handleDelete(customerId) {
    if (
      !(await confirm({
        title: t("confirm.deleteTitle"),
        message: t("customers.confirmDelete"),
        tone: "danger",
      }))
    ) {
      return;
    }
    if (editingCustomer.id === customerId) {
      setEditingCustomer(EMPTY_EDIT);
    }
    await onDeleteCustomer(customerId);
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
        <h2>{t("customers.title")}</h2>
        <p className="section-lead">{t("customers.lead")}</p>
      </div>
      <section className="panel entity-list">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{t("customers.listTitle")}</h3>
          <Button variant="primary" onClick={openCreateModal}>
            {t("customers.new", { defaultValue: "New" })}
          </Button>
        </div>
        {customers.length === 0 ? (
          <p className="entity-list-empty">{t("customers.empty")}</p>
        ) : (
          <DataTable
            showSearch
            searchValue={searchText}
            onSearchValueChange={setSearchText}
            onSearch={() => setAppliedSearch(searchText)}
            searchPlaceholder={t("customers.searchPlaceholder", { defaultValue: "Search customers..." })}
            searchButtonLabel={t("common.search", { defaultValue: "Search" })}
            pagination={{
              page: customerPage,
              pageSize: customerPageSize,
              totalRows: filteredCustomers.length,
              onPageChange: setCustomerPage,
              onPageSizeChange: setCustomerPageSize,
            }}
          >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t("customers.name")}</th>
                  <th>{t("customers.phone")}</th>
                  <th>{t("customers.user")}</th>
                  <th>{t("customers.depot", { defaultValue: "Depot" })}</th>
                  <th>{t("customers.address")}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    <td>{customer.name}</td>
                    <td>{customer.phone || "—"}</td>
                    <td>
                      {customer.userName ? `${customer.userName} (${customer.userUsername})` : "—"}
                    </td>
                    <td>{customer.depotName || "—"}</td>
                    <td>{customer.addressName || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <Button variant="ghost" tone="edit" onClick={() => startEdit(customer)}>
                          {t("customers.edit")}
                        </Button>
                        <Button variant="ghost" tone="delete" onClick={() => void handleDelete(customer.id)}>
                          {t("customers.delete")}
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
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="customer-create-title">
          <div className="modal-card">
            <CustomerForm
              addresses={addresses}
              depots={depots}
              customerUsers={customerUsers}
              newCustomer={newCustomer}
              setNewCustomer={setNewCustomer}
              onCreateCustomer={async (event) => {
                await onCreateCustomer(event);
                closeCreateModal();
              }}
            />
            <div className="row-actions" style={{ marginTop: 12 }}>
              <Button variant="ghost" tone="cancel" onClick={closeCreateModal}>
                {t("customers.cancel")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {isEditing ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="customer-edit-title">
          <form className="panel form modal-card" onSubmit={submitEdit}>
            <h3 id="customer-edit-title">{t("customers.editTitle")}</h3>
            <label className="form-label" htmlFor="customer-edit-name">
              {t("customers.name")}
            </label>
            <input
              id="customer-edit-name"
              value={editingCustomer.name}
              onChange={(event) => setEditingCustomer({ ...editingCustomer, name: event.target.value })}
              required
              minLength={2}
            />
            <label className="form-label" htmlFor="customer-edit-phone">
              {t("customers.phone")}
            </label>
            <input
              id="customer-edit-phone"
              value={editingCustomer.phone}
              onChange={(event) => setEditingCustomer({ ...editingCustomer, phone: event.target.value })}
            />
            <label className="form-label" htmlFor="customer-edit-group-address">
              {t("customers.address")}
            </label>
            <select
              id="customer-edit-group-address"
              value={editingCustomer.address}
              onChange={(event) => setEditingCustomer({ ...editingCustomer, address: event.target.value })}
              required
            >
              <option value="">{t("customers.selectAddress")}</option>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.name}
                </option>
              ))}
            </select>
            <label className="form-label" htmlFor="customer-edit-user">
              {t("customers.user")}
            </label>
            <select
              id="customer-edit-user"
              value={editingCustomer.userId}
              onChange={(event) => setEditingCustomer({ ...editingCustomer, userId: event.target.value })}
              required
            >
              <option value="">{t("customers.selectUser")}</option>
              {customerUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.username})
                </option>
              ))}
            </select>
            <label className="form-label" htmlFor="customer-edit-depot">
              {t("customers.depot", { defaultValue: "Depot" })}
            </label>
            <select
              id="customer-edit-depot"
              value={editingCustomer.depotId || ""}
              onChange={(event) => setEditingCustomer({ ...editingCustomer, depotId: event.target.value })}
            >
              <option value="">{t("customers.selectDepot", { defaultValue: "— Select depot —" })}</option>
              {depots.map((depot) => (
                <option key={depot.id} value={depot.id}>
                  {depot.name}
                </option>
              ))}
            </select>
            <div className="row-actions">
              <Button variant="primary" type="submit">
                {t("customers.update")}
              </Button>
              <Button variant="ghost" tone="cancel" onClick={cancelEdit}>
                {t("customers.cancel")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
