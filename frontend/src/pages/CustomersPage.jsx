import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { usePagination } from "../hooks/usePagination";
import { CustomerForm } from "../features/customer/CustomerForm";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { useConfirm } from "../components/ui/ConfirmProvider";

const EMPTY_EDIT = { id: "", name: "", phone: "", latitude: "", longitude: "", depotId: "" };

function buildCustomerSavePayload(editing) {
  const payload = {
    name: editing.name,
    phone: editing.phone,
    depotId: editing.depotId,
  };
  const lat = String(editing.latitude ?? "").trim();
  const lng = String(editing.longitude ?? "").trim();
  if (lat && lng) {
    payload.latitude = lat;
    payload.longitude = lng;
  }
  return payload;
}

export function CustomersPage({
  customers,
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
        customer.latitude,
        customer.longitude,
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
      latitude: customer.latitude != null ? String(customer.latitude) : "",
      longitude: customer.longitude != null ? String(customer.longitude) : "",
      depotId: customer.depotId || "",
    });
  }

  function cancelEdit() {
    setEditingCustomer(EMPTY_EDIT);
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingCustomer.id) return;
    await onUpdateCustomer(editingCustomer.id, buildCustomerSavePayload(editingCustomer));
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
        <p className="section-lead" style={{ marginTop: 8 }}>
          {t("customers.linkLoginLead")}
        </p>
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
                  <th>{t("customers.latitude")}</th>
                  <th>{t("customers.longitude")}</th>
                  <th>{t("customers.mapsLink")}</th>
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
                    <td>{customer.latitude != null ? customer.latitude : "—"}</td>
                    <td>{customer.longitude != null ? customer.longitude : "—"}</td>
                    <td>
                      {customer.latitude != null && customer.longitude != null ? (
                        <a
                          href={`https://www.google.com/maps?q=${encodeURIComponent(`${customer.latitude},${customer.longitude}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t("customers.mapsLink")}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
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
              depots={depots}
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
            <label className="form-label" htmlFor="customer-edit-latitude">
              {t("customers.latitude")}
            </label>
            <input
              id="customer-edit-latitude"
              type="number"
              step="any"
              value={editingCustomer.latitude}
              onChange={(event) => setEditingCustomer({ ...editingCustomer, latitude: event.target.value })}
              placeholder={t("customers.latitudePlaceholder")}
            />
            <label className="form-label" htmlFor="customer-edit-longitude">
              {t("customers.longitude")}
            </label>
            <input
              id="customer-edit-longitude"
              type="number"
              step="any"
              value={editingCustomer.longitude}
              onChange={(event) => setEditingCustomer({ ...editingCustomer, longitude: event.target.value })}
              placeholder={t("customers.longitudePlaceholder")}
            />
            <label className="form-label" htmlFor="customer-edit-depot">
              {t("customers.depot", { defaultValue: "Depot" })}{" "}
              <span className="form-optional">({t("createOrder.optional")})</span>
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
