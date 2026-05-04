import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "../components/ui/DataTable";
import "./PaymentsPage.css";

function formatMoney(amount, currency, locale) {
  const cur = currency === "KHR" ? "KHR" : "USD";
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

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("paymentTotalsPage.title")}</h2>
        <p className="section-lead">{t("paymentTotalsPage.lead")}</p>
      </div>

      <div className="section-heading" style={{ marginTop: 8 }}>
        <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{t("paymentTotalsPage.byCustomer")}</h3>
      </div>
      <DataTable>
          <thead>
            <tr>
              <th>{t("paymentTotalsPage.customer")}</th>
              <th>{t("paymentTotalsPage.currency")}</th>
              <th>{t("paymentTotalsPage.orders")}</th>
              <th>{t("paymentTotalsPage.total")}</th>
            </tr>
          </thead>
          <tbody>
            {byCustomer.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ color: "var(--text-muted)" }}>
                  {t("paymentTotalsPage.empty")}
                </td>
              </tr>
            ) : (
              byCustomer.map((row) => (
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
      <DataTable>
          <thead>
            <tr>
              <th>{t("paymentTotalsPage.depot")}</th>
              <th>{t("paymentTotalsPage.currency")}</th>
              <th>{t("paymentTotalsPage.orders")}</th>
              <th>{t("paymentTotalsPage.total")}</th>
            </tr>
          </thead>
          <tbody>
            {byDepot.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ color: "var(--text-muted)" }}>
                  {t("paymentTotalsPage.empty")}
                </td>
              </tr>
            ) : (
              byDepot.map((row) => (
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
