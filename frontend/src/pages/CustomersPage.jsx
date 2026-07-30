import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { usePagination } from "../hooks/usePagination";
import { CustomerForm } from "../features/customer/CustomerForm";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { FormModal } from "../components/ui/FormModal";
import { useConfirm } from "../components/ui/ConfirmProvider";

const EMPTY_EDIT = { id: "", name: "", phone: "", latitude: "", longitude: "", depotId: "", provinceId: "" };

function customerHasDepot(customer) {
  return customer?.depotId != null && String(customer.depotId).trim() !== "";
}

function buildCustomerSavePayload(editing) {
  const payload = {
    name: editing.name,
    phone: editing.phone,
    depotId: editing.depotId,
    provinceId: editing.provinceId,
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
  provinces = [],
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
  const [depotFilter, setDepotFilter] = useState("all");
  const isEditing = useMemo(() => Boolean(editingCustomer.id), [editingCustomer.id]);
  const filteredCustomers = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    return customers.filter((customer) => {
      if (depotFilter === "underDepot" && !customerHasDepot(customer)) return false;
      if (depotFilter === "independent" && customerHasDepot(customer)) return false;
      if (!keyword) return true;
      return [
        customer.id,
        customer.name,
        customer.phone,
        customer.userName,
        customer.userUsername,
        customer.depotName,
        customer.provinceName,
        customer.latitude,
        customer.longitude,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [customers, appliedSearch, depotFilter]);
  const {
    page: customerPage,
    pageSize: customerPageSize,
    paged: pagedCustomers,
    setPage: setCustomerPage,
    setPageSize: setCustomerPageSize,
  } = usePagination(filteredCustomers, { resetKey: `${appliedSearch}:${depotFilter}` });

  function startEdit(customer) {
    setEditingCustomer({
      id: customer.id,
      name: customer.name || "",
      phone: customer.phone ?? "",
      latitude: customer.latitude != null ? String(customer.latitude) : "",
      longitude: customer.longitude != null ? String(customer.longitude) : "",
      depotId: customer.depotId || "",
      provinceId: customer.provinceId || "",
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
            searchExtra={
              <select
                value={depotFilter}
                onChange={(event) => setDepotFilter(event.target.value)}
                aria-label={t("customers.filterByType", { defaultValue: "Filter by customer type" })}
              >
                <option value="all">{t("customers.filterAll", { defaultValue: "All customers" })}</option>
                <option value="underDepot">
                  {t("customers.filterUnderDepot", { defaultValue: "Customer under depot" })}
                </option>
                <option value="independent">
                  {t("customers.filterIndependent", { defaultValue: "Independent customer" })}
                </option>
              </select>
            }
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
                  <th>{t("customers.province", { defaultValue: "Province" })}</th>
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
                    <td>{customer.provinceName || "—"}</td>
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
      <FormModal
        open={showCreateModal}
        title={t("customers.formTitle")}
        titleId="customer-create-title"
        size="lg"
        onClose={closeCreateModal}
        footer={
          <div className="row-actions">
            <Button variant="ghost" tone="cancel" onClick={closeCreateModal}>
              {t("customers.cancel")}
            </Button>
            <Button variant="primary" type="submit" form="customer-create-form">
              {t("customers.save")}
            </Button>
          </div>
        }
      >
        <CustomerForm
          mode="create"
          formId="customer-create-form"
          depots={depots}
          provinces={provinces}
          value={newCustomer}
          onChange={setNewCustomer}
          onSubmit={async (event) => {
            await onCreateCustomer(event);
            closeCreateModal();
          }}
        />
      </FormModal>
      <FormModal
        open={isEditing}
        title={t("customers.editTitle")}
        titleId="customer-edit-title"
        size="lg"
        onClose={cancelEdit}
        footer={
          <div className="row-actions">
            <Button variant="ghost" tone="cancel" onClick={cancelEdit}>
              {t("customers.cancel")}
            </Button>
            <Button variant="primary" type="submit" form="customer-edit-form">
              {t("customers.update")}
            </Button>
          </div>
        }
      >
        <CustomerForm
          mode="edit"
          formId="customer-edit-form"
          depots={depots}
          provinces={provinces}
          value={editingCustomer}
          onChange={setEditingCustomer}
          onSubmit={submitEdit}
        />
      </FormModal>
    </section>
  );
}
