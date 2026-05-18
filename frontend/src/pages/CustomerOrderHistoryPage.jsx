import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../hooks/usePagination";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { CustomerOrdersDetailModal } from "../features/customer/CustomerOrdersDetailModal";

export function CustomerOrderHistoryPage({ customers = [], orders = [] }) {
  const { t } = useTranslation();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const orderCountByCustomerId = useMemo(() => {
    const counts = new Map();
    for (const order of orders) {
      if (order.customerId == null || order.customerId === "") continue;
      const cid = String(order.customerId);
      counts.set(cid, (counts.get(cid) || 0) + 1);
    }
    return counts;
  }, [orders]);

  const summaryRows = useMemo(() => {
    return [...customers]
      .map((customer) => ({
        customerId: String(customer.id),
        customerName: customer.name || "",
        phone: customer.phone || "",
        orderCount: orderCountByCustomerId.get(String(customer.id)) || 0,
        customer,
      }))
      .sort((a, b) =>
        a.customerName.localeCompare(b.customerName, undefined, { sensitivity: "base" }),
      );
  }, [customers, orderCountByCustomerId]);

  const filteredSummary = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return summaryRows;
    return summaryRows.filter((row) =>
      [row.customerId, row.customerName, row.phone, row.orderCount]
        .filter((value) => value !== "" && value != null)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [summaryRows, appliedSearch]);

  const {
    page,
    pageSize,
    paged: pagedSummary,
    setPage,
    setPageSize,
  } = usePagination(filteredSummary, { resetKey: appliedSearch });

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("customerOrderHistory.title")}</h2>
        <p className="section-lead">{t("customerOrderHistory.lead")}</p>
      </div>

      <section className="panel entity-list">
        {customers.length === 0 ? (
          <p className="entity-list-empty">{t("customers.empty")}</p>
        ) : (
          <DataTable
            showSearch
            searchValue={searchText}
            onSearchValueChange={setSearchText}
            onSearch={() => setAppliedSearch(searchText)}
            searchPlaceholder={t("customerOrderHistory.searchCustomersPlaceholder")}
            searchButtonLabel={t("common.search", { defaultValue: "Search" })}
            pagination={{
              page,
              pageSize,
              totalRows: filteredSummary.length,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          >
            <thead>
              <tr>
                <th>{t("customers.name")}</th>
                <th>{t("customers.phone")}</th>
                <th>{t("customerOrderHistory.orderCount")}</th>
                <th>{t("orders.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {pagedSummary.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: "var(--text-muted)" }}>
                    {t("customerOrderHistory.empty")}
                  </td>
                </tr>
              ) : (
                pagedSummary.map((row) => (
                  <tr key={row.customerId}>
                    <td>{row.customerName || t("orders.dash")}</td>
                    <td>{row.phone || t("orders.dash")}</td>
                    <td>{row.orderCount}</td>
                    <td>
                      <Button
                        variant="ghost"
                        tone="view"
                        onClick={() => setSelectedCustomer(row.customer)}
                      >
                        {t("orders.view")}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </DataTable>
        )}
      </section>

      <CustomerOrdersDetailModal
        customer={selectedCustomer}
        orders={orders}
        onClose={() => setSelectedCustomer(null)}
      />
    </section>
  );
}
