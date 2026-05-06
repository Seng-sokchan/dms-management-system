import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../hooks/usePagination";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { useConfirm } from "../components/ui/ConfirmProvider";
import { DepotCreatePopupForm, DepotEditPopupForm } from "../features/depot/DepotForm";
import { DepotCustomersDetailModal } from "../features/depot/DepotCustomersDetailModal";
import "../features/depot/depots.css";

const EMPTY_EDIT = {
  id: "",
  name: "",
  phone: "",
  address: "",
  ownerUserId: "",
  depotUserId: "",
};

export function DepotsPage({
  depots,
  customers = [],
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
  const canManageDepots = user?.role === "Admin" || user?.role === "Owner";

  const depotCustomerSummary = useMemo(() => {
    const byDepotId = new Map();
    for (const c of customers) {
      const did = c.depotId != null && String(c.depotId).trim() !== "" ? String(c.depotId) : null;
      if (!did) continue;
      let entry = byDepotId.get(did);
      if (!entry) {
        entry = { total: 0, withPortalUser: 0, distinctCustomerUserIds: new Set() };
        byDepotId.set(did, entry);
      }
      entry.total += 1;
      const uid = c.userId != null && String(c.userId).trim() !== "" ? String(c.userId) : null;
      if (uid) {
        entry.withPortalUser += 1;
        entry.distinctCustomerUserIds.add(uid);
      }
    }
    return depots.map((depot) => {
      const did = String(depot.id);
      const agg = byDepotId.get(did) || {
        total: 0,
        withPortalUser: 0,
        distinctCustomerUserIds: new Set(),
      };
      return {
        depotId: did,
        depotName: depot.name || "",
        depotUserId: depot.depotUserId || "",
        depotUserName: depot.depotUserName || "",
        customerCount: agg.total,
        customersWithPortalUser: agg.withPortalUser,
        distinctLinkedCustomerUsers: agg.distinctCustomerUserIds.size,
      };
    });
  }, [depots, customers]);

  const customersByDepotId = useMemo(() => {
    const m = new Map();
    for (const c of customers) {
      const did = c.depotId != null && String(c.depotId).trim() !== "" ? String(c.depotId) : null;
      if (!did) continue;
      if (!m.has(did)) m.set(did, []);
      m.get(did).push(c);
    }
    for (const list of m.values()) {
      list.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" }),
      );
    }
    return m;
  }, [customers]);

  const [customerDetailDepot, setCustomerDetailDepot] = useState(null);
  const [expandedDepotId, setExpandedDepotId] = useState(null);
  const [depotSearchText, setDepotSearchText] = useState("");
  const [depotAppliedSearch, setDepotAppliedSearch] = useState("");
  const [summarySearchText, setSummarySearchText] = useState("");
  const [summaryAppliedSearch, setSummaryAppliedSearch] = useState("");

  const customersForDetailModal = useMemo(() => {
    if (!customerDetailDepot?.id) return [];
    const id = String(customerDetailDepot.id);
    return customersByDepotId.get(id) ?? [];
  }, [customersByDepotId, customerDetailDepot]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDepot, setEditingDepot] = useState(EMPTY_EDIT);
  const isEditing = useMemo(() => Boolean(editingDepot.id), [editingDepot.id]);
  const filteredDepots = useMemo(() => {
    const keyword = depotAppliedSearch.trim().toLowerCase();
    if (!keyword) return depots;
    return depots.filter((depot) =>
      [depot.id, depot.name, depot.phone, depot.address, depot.ownerUserName, depot.depotUserName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [depots, depotAppliedSearch]);
  const filteredDepotCustomerSummary = useMemo(() => {
    const keyword = summaryAppliedSearch.trim().toLowerCase();
    if (!keyword) return depotCustomerSummary;
    return depotCustomerSummary.filter((row) =>
      [
        row.depotId,
        row.depotName,
        row.depotUserId,
        row.depotUserName,
        row.customerCount,
        row.customersWithPortalUser,
        row.distinctLinkedCustomerUsers,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [depotCustomerSummary, summaryAppliedSearch]);
  const {
    page: depotListPage,
    pageSize: depotListPageSize,
    paged: pagedDepots,
    setPage: setDepotListPage,
    setPageSize: setDepotListPageSize,
  } = usePagination(filteredDepots, { resetKey: depotAppliedSearch });
  const {
    page: summaryPage,
    pageSize: summaryPageSize,
    paged: pagedDepotCustomerSummary,
    setPage: setSummaryPage,
    setPageSize: setSummaryPageSize,
  } = usePagination(filteredDepotCustomerSummary, { resetKey: summaryAppliedSearch });

  function startEdit(depot) {
    setEditingDepot({
      id: depot.id,
      name: depot.name || "",
      phone: depot.phone || "",
      address: depot.address || "",
      ownerUserId: depot.ownerUserId || "",
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
      ownerUserId: editingDepot.ownerUserId || undefined,
      depotUserId: editingDepot.depotUserId || undefined,
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
                  <th>{t("depots.owner")}</th>
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
                    <td>{depot.ownerUserName || "—"}</td>
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

      <section className="panel entity-list" style={{ marginTop: 24 }}>
        <h3 style={{ margin: "0 0 12px" }}>{t("depots.customerSummaryTitle")}</h3>
        <p className="section-lead" style={{ marginBottom: 12 }}>
          {t("depots.customerSummaryLead")}
        </p>
        {depots.length === 0 ? (
          <p className="entity-list-empty">{t("depots.empty")}</p>
        ) : (
          <DataTable
            showSearch
            searchValue={summarySearchText}
            onSearchValueChange={setSummarySearchText}
            onSearch={() => setSummaryAppliedSearch(summarySearchText)}
            searchPlaceholder={t("depots.summarySearchPlaceholder", { defaultValue: "Search depot summaries..." })}
            searchButtonLabel={t("common.search", { defaultValue: "Search" })}
            pagination={{
              page: summaryPage,
              pageSize: summaryPageSize,
              totalRows: filteredDepotCustomerSummary.length,
              onPageChange: setSummaryPage,
              onPageSizeChange: setSummaryPageSize,
            }}
          >
              <thead>
                <tr>
                  <th className="data-table__col-expand" aria-label={t("depots.expandColumnLabel")} />
                  <th>{t("depots.name")}</th>
                  <th>{t("depots.depotUserId")}</th>
                  <th>{t("depots.depotUser")}</th>
                  <th>{t("depots.customerCount")}</th>
                  <th>{t("depots.customersWithPortalUser")}</th>
                  <th>{t("depots.distinctCustomerUsers")}</th>
                  <th>{t("depots.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {pagedDepotCustomerSummary.map((row) => {
                  const rowCustomers = customersByDepotId.get(row.depotId) ?? [];
                  const isExpanded = expandedDepotId === row.depotId;
                  return (
                    <Fragment key={row.depotId}>
                      <tr>
                        <td className="data-table__col-expand">
                          <button
                            type="button"
                            className="depot-customers-expand"
                            aria-expanded={isExpanded}
                            aria-controls={`depot-customers-inline-${row.depotId}`}
                            aria-label={
                              isExpanded ? t("depots.collapseCustomerNames") : t("depots.expandCustomerNames")
                            }
                            onClick={() =>
                              setExpandedDepotId((prev) => (prev === row.depotId ? null : row.depotId))
                            }
                          >
                            <span className="depot-customers-expand__icon" aria-hidden>
                              {isExpanded ? "▼" : "▶"}
                            </span>
                          </button>
                        </td>
                        <td>{row.depotName}</td>
                        <td>{row.depotUserId || "—"}</td>
                        <td>{row.depotUserName || "—"}</td>
                        <td>{row.customerCount}</td>
                        <td>{row.customersWithPortalUser}</td>
                        <td>{row.distinctLinkedCustomerUsers}</td>
                        <td>
                          <Button
                            variant="ghost"
                            tone="view"
                            onClick={() => setCustomerDetailDepot({ id: row.depotId, name: row.depotName })}
                          >
                            {t("depots.viewCustomers")}
                          </Button>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr key={`${row.depotId}-expand`} className="data-table__expand-row">
                          <td colSpan={8} id={`depot-customers-inline-${row.depotId}`}>
                            {rowCustomers.length === 0 ? (
                              <p className="depot-customers-inline__empty">{t("depots.customersInDepotEmpty")}</p>
                            ) : (
                              <ul className="depot-customers-inline__list">
                                {rowCustomers.map((c) => (
                                  <li key={c.id}>
                                    <span className="depot-customers-inline__name">{c.name}</span>
                                    {c.phone ? (
                                      <span className="depot-customers-inline__meta">{c.phone}</span>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
          </DataTable>
        )}
      </section>

      <DepotCustomersDetailModal
        depot={customerDetailDepot}
        customers={customersForDetailModal}
        onClose={() => setCustomerDetailDepot(null)}
      />

      <DepotCreatePopupForm
        open={showCreateModal}
        user={user}
        users={users}
        newDepot={newDepot}
        setNewDepot={setNewDepot}
        onCreateDepot={onCreateDepot}
        onClose={closeCreateModal}
      />

      <DepotEditPopupForm
        open={isEditing}
        user={user}
        users={users}
        editingDepot={editingDepot}
        setEditingDepot={setEditingDepot}
        onSubmitEdit={submitEdit}
        onClose={cancelEdit}
      />
    </section>
  );
}
