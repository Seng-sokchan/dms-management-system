import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../hooks/usePagination";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { DepotCustomersDetailModal } from "../features/depot/DepotCustomersDetailModal";
import "../features/depot/depots.css";

export function CustomersByDepotPage({ depots = [], customers = [] }) {
  const { t } = useTranslation();

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
      list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
    }
    return m;
  }, [customers]);

  const [customerDetailDepot, setCustomerDetailDepot] = useState(null);
  const [expandedDepotId, setExpandedDepotId] = useState(null);
  const [summarySearchText, setSummarySearchText] = useState("");
  const [summaryAppliedSearch, setSummaryAppliedSearch] = useState("");

  const customersForDetailModal = useMemo(() => {
    if (!customerDetailDepot?.id) return [];
    const id = String(customerDetailDepot.id);
    return customersByDepotId.get(id) ?? [];
  }, [customersByDepotId, customerDetailDepot]);

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
    page: summaryPage,
    pageSize: summaryPageSize,
    paged: pagedDepotCustomerSummary,
    setPage: setSummaryPage,
    setPageSize: setSummaryPageSize,
  } = usePagination(filteredDepotCustomerSummary, { resetKey: summaryAppliedSearch });

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("depots.customerSummaryTitle")}</h2>
        <p className="section-lead">{t("depots.customerSummaryLead")}</p>
      </div>

      <section className="panel entity-list">
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
    </section>
  );
}
