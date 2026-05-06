import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { usePagination } from "../../hooks/usePagination";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import "./DepotCustomersDetailModal.css";

export function DepotCustomersDetailModal({ depot, customers, onClose }) {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const filteredCustomers = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return customers;
    return customers.filter((entry) =>
      [entry.id, entry.name, entry.phone, entry.userName, entry.userUsername]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [customers, appliedSearch]);
  const {
    page,
    pageSize,
    paged: pagedCustomers,
    setPage,
    setPageSize,
  } = usePagination(filteredCustomers, { resetKey: appliedSearch });
  if (!depot) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="depot-customers-detail-title"
      onClick={onClose}
    >
      <div
        className="panel modal-card depot-modal-card--customers"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="depot-customers-detail-title" style={{ marginTop: 0 }}>
          {t("depots.customersInDepotTitle", { depot: depot.name || t("depots.title") })}
        </h3>
        {customers.length === 0 ? (
          <p className="entity-list-empty depot-customers-modal__empty">{t("depots.customersInDepotEmpty")}</p>
        ) : (
          <DataTable
            className="depot-customers-modal__table-wrap"
            showSearch
            searchValue={searchText}
            onSearchValueChange={setSearchText}
            onSearch={() => setAppliedSearch(searchText)}
            searchPlaceholder={t("depots.searchCustomersPlaceholder", { defaultValue: "Search customers..." })}
            searchButtonLabel={t("common.search", { defaultValue: "Search" })}
            pagination={{
              page,
              pageSize,
              totalRows: filteredCustomers.length,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t("customers.name")}</th>
                  <th>{t("customers.phone")}</th>
                  <th>{t("customers.user")}</th>
                </tr>
              </thead>
              <tbody>
                {pagedCustomers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.name}</td>
                    <td>{c.phone || "—"}</td>
                    <td>
                      {c.userName || c.userUsername
                        ? [c.userName, c.userUsername].filter(Boolean).join(" · ")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
          </DataTable>
        )}
        <div className="row-actions depot-customers-modal__footer">
          <Button variant="primary" onClick={onClose}>
            {t("depots.closeDetail")}
          </Button>
        </div>
      </div>
    </div>
  );
}
