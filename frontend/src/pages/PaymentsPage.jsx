import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../hooks/usePagination";
import { DataTable } from "../components/ui/DataTable";
import "./PaymentsPage.css";

function formatMoney(amount, currency, locale) {
  const cur = currency === "USD" ? "USD" : "KHR";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: cur === "KHR" ? 0 : 2,
    }).format(Number(amount) || 0);
  } catch {
    return `${amount} ${currency || ""}`.trim();
  }
}

export function PaymentsPage({ paymentTotals }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "km" ? "km-KH" : "en-US";
  const byCustomer = useMemo(() => paymentTotals?.byCustomer ?? [], [paymentTotals]);
  const byDepot = useMemo(() => paymentTotals?.byDepot ?? [], [paymentTotals]);
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [customerAppliedSearch, setCustomerAppliedSearch] = useState("");
  const [depotSearchText, setDepotSearchText] = useState("");
  const [depotAppliedSearch, setDepotAppliedSearch] = useState("");
  const filteredByCustomer = useMemo(() => {
    const keyword = customerAppliedSearch.trim().toLowerCase();
    if (!keyword) return byCustomer;
    return byCustomer.filter((row) =>
      [row.customerName, row.currency, row.orderCount, row.totalAmount]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [byCustomer, customerAppliedSearch]);
  const filteredByDepot = useMemo(() => {
    const keyword = depotAppliedSearch.trim().toLowerCase();
    if (!keyword) return byDepot;
    return byDepot.filter((row) =>
      [row.depotName, row.currency, row.orderCount, row.totalAmount]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [byDepot, depotAppliedSearch]);
  const {
    page: customerPage,
    pageSize: customerPageSize,
    paged: pagedByCustomer,
    setPage: setCustomerPage,
    setPageSize: setCustomerPageSize,
  } = usePagination(filteredByCustomer, { resetKey: customerAppliedSearch });
  const {
    page: depotPage,
    pageSize: depotPageSize,
    paged: pagedByDepot,
    setPage: setDepotPage,
    setPageSize: setDepotPageSize,
  } = usePagination(filteredByDepot, { resetKey: depotAppliedSearch });

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("paymentTotalsPage.title")}</h2>
        <p className="section-lead">{t("paymentTotalsPage.lead")}</p>
      </div>

      <div className="section-heading" style={{ marginTop: 8 }}>
        <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{t("paymentTotalsPage.byCustomer")}</h3>
      </div>
      <DataTable
        showSearch
        searchValue={customerSearchText}
        onSearchValueChange={setCustomerSearchText}
        onSearch={() => setCustomerAppliedSearch(customerSearchText)}
        searchPlaceholder={t("paymentTotalsPage.searchCustomersPlaceholder", { defaultValue: "Search customer totals..." })}
        searchButtonLabel={t("common.search", { defaultValue: "Search" })}
        pagination={{
          page: customerPage,
          pageSize: customerPageSize,
          totalRows: filteredByCustomer.length,
          onPageChange: setCustomerPage,
          onPageSizeChange: setCustomerPageSize,
        }}
      >
          <thead>
            <tr>
              <th>{t("paymentTotalsPage.customer")}</th>
              <th>{t("paymentTotalsPage.currency")}</th>
              <th>{t("paymentTotalsPage.orders")}</th>
              <th>{t("paymentTotalsPage.total")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredByCustomer.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ color: "var(--text-muted)" }}>
                  {t("paymentTotalsPage.empty")}
                </td>
              </tr>
            ) : (
              pagedByCustomer.map((row) => (
                <tr key={`${row.customerId}-${row.currency}`}>
                  <td>{row.customerName}</td>
                  <td>{row.currency}</td>
                  <td>{row.orderCount}</td>
                  <td>{formatMoney(row.totalAmount, row.currency, locale)}</td>
                </tr>
              ))
            )}
          </tbody>
      </DataTable>

      <div className="section-heading" style={{ marginTop: 28 }}>
        <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{t("paymentTotalsPage.byDepot")}</h3>
      </div>
      <DataTable
        showSearch
        searchValue={depotSearchText}
        onSearchValueChange={setDepotSearchText}
        onSearch={() => setDepotAppliedSearch(depotSearchText)}
        searchPlaceholder={t("paymentTotalsPage.searchDepotsPlaceholder", { defaultValue: "Search depot totals..." })}
        searchButtonLabel={t("common.search", { defaultValue: "Search" })}
        pagination={{
          page: depotPage,
          pageSize: depotPageSize,
          totalRows: filteredByDepot.length,
          onPageChange: setDepotPage,
          onPageSizeChange: setDepotPageSize,
        }}
      >
          <thead>
            <tr>
              <th>{t("paymentTotalsPage.depot")}</th>
              <th>{t("paymentTotalsPage.currency")}</th>
              <th>{t("paymentTotalsPage.orders")}</th>
              <th>{t("paymentTotalsPage.total")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredByDepot.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ color: "var(--text-muted)" }}>
                  {t("paymentTotalsPage.empty")}
                </td>
              </tr>
            ) : (
              pagedByDepot.map((row) => (
                <tr key={`${row.depotId}-${row.currency}`}>
                  <td>{row.depotName}</td>
                  <td>{row.currency}</td>
                  <td>{row.orderCount}</td>
                  <td>{formatMoney(row.totalAmount, row.currency, locale)}</td>
                </tr>
              ))
            )}
          </tbody>
      </DataTable>
    </section>
  );
}
