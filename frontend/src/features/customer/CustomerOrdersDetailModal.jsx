import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../../hooks/usePagination";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import "../depot/DepotCustomersDetailModal.css";

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

function formatCreatedAt(value, locale) {
  if (value == null || value === "") return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function itemLabel(order) {
  const name = order.itemName?.trim();
  const sku = order.itemSku?.trim();
  if (name && sku) return `${name} (${sku})`;
  return name || sku || `#${order.id}`;
}

export function CustomerOrdersDetailModal({ customer, orders = [], onClose }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "km" ? "km-KH" : "en-US";
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const customerOrders = useMemo(() => {
    if (!customer?.id) return [];
    const cid = String(customer.id);
    return orders
      .filter((order) => String(order.customerId) === cid)
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [customer, orders]);

  const filteredOrders = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return customerOrders;
    return customerOrders.filter((order) =>
      [
        order.id,
        order.itemName,
        order.itemSku,
        order.status,
        order.orderedQty,
        order.amountTotal,
        order.currency,
        order.deliveryAgentName,
        order.createdAt,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [customerOrders, appliedSearch]);

  const {
    page,
    pageSize,
    paged: pagedOrders,
    setPage,
    setPageSize,
  } = usePagination(filteredOrders, { resetKey: appliedSearch });

  if (!customer) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-orders-detail-title"
      onClick={onClose}
    >
      <div
        className="panel modal-card depot-modal-card--customers"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="customer-orders-detail-title" style={{ marginTop: 0 }}>
          {t("customerOrderHistory.ordersForCustomer", {
            customer: customer.name || t("customers.title"),
          })}
        </h3>
        <p className="form-hint" style={{ marginTop: 0 }}>
          {t("customerOrderHistory.orderCountLabel", { count: customerOrders.length })}
        </p>
        {customerOrders.length === 0 ? (
          <p className="entity-list-empty depot-customers-modal__empty">
            {t("customerOrderHistory.noOrders")}
          </p>
        ) : (
          <DataTable
            className="depot-customers-modal__table-wrap"
            showSearch
            searchValue={searchText}
            onSearchValueChange={setSearchText}
            onSearch={() => setAppliedSearch(searchText)}
            searchPlaceholder={t("customerOrderHistory.searchOrdersPlaceholder")}
            searchButtonLabel={t("common.search", { defaultValue: "Search" })}
            pagination={{
              page,
              pageSize,
              totalRows: filteredOrders.length,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          >
            <thead>
              <tr>
                <th>{t("customerOrderHistory.orderId")}</th>
                <th>{t("orders.item")}</th>
                <th>{t("orders.qty")}</th>
                <th>{t("orders.distributed")}</th>
                <th>{t("orders.loss")}</th>
                <th>{t("orders.status")}</th>
                <th>{t("customerOrderHistory.amount")}</th>
                <th>{t("customerOrderHistory.createdAt")}</th>
                <th>{t("orders.delivery")}</th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{itemLabel(order)}</td>
                  <td>{order.orderedQty ?? "—"}</td>
                  <td>{order.deliveredQty != null ? order.deliveredQty : "—"}</td>
                  <td>{order.lossQty != null ? order.lossQty : "—"}</td>
                  <td>
                    <span className="status-chip">{order.status || "—"}</span>
                  </td>
                  <td>{formatMoney(order.amountTotal, order.currency, locale)}</td>
                  <td>{formatCreatedAt(order.createdAt, locale)}</td>
                  <td>{order.deliveryAgentName || t("orders.dash")}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
        <div className="row-actions depot-customers-modal__footer">
          <Button variant="primary" onClick={onClose}>
            {t("customerOrderHistory.closeDetail")}
          </Button>
        </div>
      </div>
    </div>
  );
}
