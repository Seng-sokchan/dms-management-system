import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../hooks/usePagination";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { FormModal } from "../components/ui/FormModal";
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

function orderOptionLabel(row, t) {
  const typeLabel =
    row.targetLabel === "depot"
      ? t("paymentTotalsPage.depot")
      : t("paymentTotalsPage.customer");
  const orderNo = row.orderNo || `#${row.masterOrderId}`;
  return `${orderNo} — ${typeLabel}: ${row.partyName}`;
}

export function PaymentsPage({
  paymentTotals,
  onRecordManualPayment,
  onLoadUnpaidOrders,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "km" ? "km-KH" : "en-US";
  const byCustomer = useMemo(
    () => (paymentTotals?.byCustomer ?? []).filter((row) => row.depotId == null),
    [paymentTotals],
  );
  const byDepot = useMemo(() => paymentTotals?.byDepot ?? [], [paymentTotals]);
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [customerAppliedSearch, setCustomerAppliedSearch] = useState("");
  const [depotSearchText, setDepotSearchText] = useState("");
  const [depotAppliedSearch, setDepotAppliedSearch] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [loadingUnpaid, setLoadingUnpaid] = useState(false);
  const [selectedMasterOrderId, setSelectedMasterOrderId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

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

  const selectedOrder = useMemo(
    () => unpaidOrders.find((row) => String(row.masterOrderId) === String(selectedMasterOrderId)),
    [unpaidOrders, selectedMasterOrderId],
  );

  async function openManualModal() {
    setManualOpen(true);
    setSelectedMasterOrderId("");
    setNote("");
    setLoadingUnpaid(true);
    try {
      const rows = typeof onLoadUnpaidOrders === "function" ? await onLoadUnpaidOrders() : [];
      setUnpaidOrders(Array.isArray(rows) ? rows : []);
    } finally {
      setLoadingUnpaid(false);
    }
  }

  function closeManualModal() {
    setManualOpen(false);
    setSelectedMasterOrderId("");
    setNote("");
    setUnpaidOrders([]);
    setSaving(false);
  }

  async function handleManualSubmit(event) {
    event.preventDefault();
    if (!selectedOrder || typeof onRecordManualPayment !== "function") return;
    setSaving(true);
    try {
      const ok = await onRecordManualPayment({
        masterOrderId: Number(selectedOrder.masterOrderId),
        note: note.trim(),
      });
      if (ok) {
        closeManualModal();
        return;
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-page">
      <div className="section-heading section-heading--with-actions">
        <div className="section-heading-text">
          <h2>{t("paymentTotalsPage.title")}</h2>
          <p className="section-lead">{t("paymentTotalsPage.lead")}</p>
        </div>
        <div className="section-heading-actions">
          <Button variant="primary" onClick={() => void openManualModal()}>
            {t("paymentTotalsPage.recordManual", { defaultValue: "Record manual payment" })}
          </Button>
        </div>
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

      <FormModal
        open={manualOpen}
        size="md"
        title={t("paymentTotalsPage.manualTitle", { defaultValue: "Record manual payment" })}
        titleId="manual-payment-title"
        onClose={closeManualModal}
        footer={
          <div className="manual-pay-footer">
            <Button type="button" variant="ghost" tone="cancel" onClick={closeManualModal} disabled={saving}>
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              type="submit"
              form="manual-payment-form"
              variant="primary"
              disabled={saving || !selectedOrder || loadingUnpaid}
            >
              {saving
                ? t("common.saving", { defaultValue: "Saving…" })
                : t("paymentTotalsPage.manualSave", { defaultValue: "Mark as paid" })}
            </Button>
          </div>
        }
      >
        <form id="manual-payment-form" className="manual-pay-form" onSubmit={(e) => void handleManualSubmit(e)}>
          <p className="manual-pay-lead">
            {t("paymentTotalsPage.manualLead", {
              defaultValue:
                "Record a payment made outside the app. The selected unpaid order will be marked fully paid.",
            })}
          </p>

          <label className="form-field">
            <span className="form-label">
              {t("paymentTotalsPage.selectUnpaidOrder", { defaultValue: "Unpaid order" })}
            </span>
            <select
              className="form-input"
              value={selectedMasterOrderId}
              disabled={loadingUnpaid || saving}
              onChange={(e) => setSelectedMasterOrderId(e.target.value)}
              required
            >
              <option value="">
                {loadingUnpaid
                  ? t("common.loading", { defaultValue: "Loading..." })
                  : t("paymentTotalsPage.selectUnpaidOrderPlaceholder", {
                      defaultValue: "— Select unpaid order —",
                    })}
              </option>
              {unpaidOrders.map((row) => (
                <option key={row.masterOrderId} value={String(row.masterOrderId)}>
                  {orderOptionLabel(row, t)}
                </option>
              ))}
            </select>
          </label>

          {selectedOrder ? (
            <div className="manual-pay-summary" aria-live="polite">
              <div className="manual-pay-summary__party">
                <span className="manual-pay-summary__eyebrow">
                  {selectedOrder.targetLabel === "depot"
                    ? t("paymentTotalsPage.depot")
                    : t("paymentTotalsPage.customer")}
                </span>
                <strong className="manual-pay-summary__name">{selectedOrder.partyName}</strong>
                <span className="manual-pay-summary__meta">
                  {selectedOrder.orderNo || `#${selectedOrder.masterOrderId}`}
                </span>
              </div>
              <div className="manual-pay-summary__grid">
                <div className="manual-pay-stat manual-pay-stat--amount">
                  <span className="manual-pay-stat__label">
                    {t("paymentTotalsPage.amount", { defaultValue: "Amount" })}
                  </span>
                  <span className="manual-pay-stat__value manual-pay-stat__value--amount">
                    {formatMoney(selectedOrder.amountTotal, selectedOrder.currency, locale)}
                  </span>
                </div>
                <div className="manual-pay-stat">
                  <span className="manual-pay-stat__label">{t("paymentTotalsPage.orders")}</span>
                  <span className="manual-pay-stat__value">{selectedOrder.lineCount}</span>
                </div>
              </div>
            </div>
          ) : null}

          {!loadingUnpaid && unpaidOrders.length === 0 ? (
            <p className="manual-pay-empty">
              {t("paymentTotalsPage.noUnpaidOrders", { defaultValue: "No unpaid orders." })}
            </p>
          ) : null}

          <label className="form-field">
            <span className="form-label">
              {t("paymentTotalsPage.note", { defaultValue: "Note (optional)" })}
            </span>
            <input
              className="form-input"
              type="text"
              maxLength={500}
              value={note}
              disabled={saving || !selectedOrder}
              placeholder={t("paymentTotalsPage.notePlaceholder", {
                defaultValue: "Cash, bank transfer, etc.",
              })}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </form>
      </FormModal>
    </section>
  );
}
