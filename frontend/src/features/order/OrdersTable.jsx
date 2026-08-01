import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { usePagination } from "../../hooks/usePagination";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { useConfirm } from "../../components/ui/ConfirmProvider";
import { DeliveryConfirmModal } from "./DeliveryConfirmModal";
import { LossUpdateModal } from "./LossUpdateModal";

const ORDER_STATUS_FALLBACK = [
  "Owner_Preparing",
  "Sent_To_Factory",
  "Ready_For_Delivery",
  "Recieve_By_Customer",
];

function formatOrderTotal(amount, currency) {
  const value = Number(amount) || 0;
  const code = String(currency || "KHR").toUpperCase();
  if (code === "USD") {
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `៛${value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function resolveDepotName(order, customersById) {
  const customerId =
    order.customerId != null && String(order.customerId).trim() !== ""
      ? String(order.customerId)
      : "";
  if (!customerId) return "";
  const customer = customersById.get(customerId);
  const depotName = customer?.depotName != null ? String(customer.depotName).trim() : "";
  const depotId = customer?.depotId != null ? String(customer.depotId).trim() : "";
  return depotId && depotName ? depotName : "";
}

export function OrdersTable({
  orders,
  customers = [],
  statuses,
  onUpdateStatus,
  onConfirmDelivery,
  onUpdateLoss,
  onDelete,
  readOnly = false,
  lossEditable = false,
  renderActions,
  searchExtra = null,
  filterKey = "",
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [confirmOrder, setConfirmOrder] = useState(null);
  const [lossOrder, setLossOrder] = useState(null);
  const statusRows = Array.isArray(statuses) && statuses.length
    ? statuses
    : ORDER_STATUS_FALLBACK.map((name) => ({ name }));
  const statusOptions = statusRows.map((row) => row.name);
  const statusReadOnly = readOnly || lossEditable;
  const showDeliverySave = !readOnly && !lossEditable;
  const showActions = lossEditable || Boolean(onDelete);

  const customersById = useMemo(() => {
    const map = new Map();
    for (const customer of customers || []) {
      if (customer?.id == null) continue;
      map.set(String(customer.id), customer);
    }
    return map;
  }, [customers]);

  async function handleSaveDelivery(order) {
    if (order.status !== "Ready_For_Delivery") {
      const ok = await confirm({
        title: t("confirm.deliverySaveTitle"),
        message: t("confirm.deliverySaveMessage"),
        tone: "primary",
      });
      if (!ok) return;
      onConfirmDelivery(order.id, { lossQty: 0 });
      return;
    }
    setConfirmOrder(order);
  }

  function handleConfirmDeliverySubmit({ lossQty }) {
    if (!confirmOrder) return;
    onConfirmDelivery(confirmOrder.id, { lossQty });
    setConfirmOrder(null);
  }

  async function handleLossUpdateSubmit({ lossQty }) {
    if (!lossOrder) return;
    const orderId = lossOrder.id;
    await onUpdateLoss?.(orderId, { lossQty });
    setLossOrder(null);
  }

  async function handleDelete(order) {
    const ok = await confirm({
      title: t("confirm.deleteTitle"),
      message: t("orders.confirmDelete", {
        defaultValue: "Delete this order?",
      }),
      tone: "danger",
    });
    if (!ok) return;
    await onDelete?.(order.id);
  }

  const rowMeta =
    orders.length === 1
      ? t("orders.rowOne", { n: orders.length })
      : t("orders.rowMany", { n: orders.length });
  const filteredOrders = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((order) =>
      [
        order.customerName,
        resolveDepotName(order, customersById),
        order.itemName,
        order.producerName,
        order.deliveryAgentName,
        order.orderedQty,
        order.status,
        order.amountTotal,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [orders, appliedSearch, customersById]);
  const {
    page,
    pageSize,
    paged: pagedOrders,
    setPage,
    setPageSize,
  } = usePagination(filteredOrders, { resetKey: `${appliedSearch}:${filterKey}` });

  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{t("orders.allOrders")}</h3>
        <p className="panel-meta">{rowMeta}</p>
      </div>
      <DataTable
        showSearch
        searchValue={searchText}
        onSearchValueChange={setSearchText}
        onSearch={() => setAppliedSearch(searchText)}
        searchPlaceholder={t("orders.searchPlaceholder", { defaultValue: "Search orders..." })}
        searchButtonLabel={t("common.search", { defaultValue: "Search" })}
        searchExtra={searchExtra}
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
              <th>{t("orders.customer")}</th>
              <th>{t("orders.depot")}</th>
              <th>{t("orders.item")}</th>
              <th>{t("orders.producer")}</th>
              <th>{t("orders.delivery")}</th>
              <th>{t("orders.qty")}</th>
              <th>{t("orders.distributed")}</th>
              <th>{t("orders.loss")}</th>
              <th>{t("orders.status")}</th>
              <th>{t("orders.orderTotal", { defaultValue: "Total" })}</th>
              {showDeliverySave ? <th>{t("orders.saveDelivery")}</th> : null}
              {showActions ? <th>{t("orders.actions", { defaultValue: "Actions" })}</th> : null}
              {renderActions ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {pagedOrders.map((order) => {
              const statusId = `order-status-${order.id}`;
              const depotName = resolveDepotName(order, customersById);
              return (
                <tr key={order.id}>
                  <td>{order.customerName}</td>
                  <td>{depotName}</td>
                  <td>{order.itemName}</td>
                  <td>{order.producerName || t("orders.dash")}</td>
                  <td>{order.deliveryAgentName || t("orders.dash")}</td>
                  <td>
                    <span className="qty-chip">{order.orderedQty}</span>
                  </td>
                  <td>{order.deliveredQty != null ? order.deliveredQty : t("orders.dash")}</td>
                  <td>{order.lossQty != null ? order.lossQty : t("orders.dash")}</td>
                  <td>
                    {statusReadOnly ? (
                      <span className="status-chip">{order.status}</span>
                    ) : (
                      <>
                        <label className="form-label" htmlFor={statusId}>
                          {t("orders.status")}
                        </label>
                        <select id={statusId} value={order.status} onChange={(event) => onUpdateStatus(order.id, event.target.value)}>
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </td>
                  <td>
                    <span className="money-inline">
                      {formatOrderTotal(order.amountTotal, order.currency)}
                    </span>
                  </td>
                  {showDeliverySave ? (
                    <td>
                      <Button variant="sm" onClick={() => void handleSaveDelivery(order)}>
                        {t("orders.saveDelivery")}
                      </Button>
                    </td>
                  ) : null}
                  {showActions ? (
                    <td>
                      <div className="row-actions">
                        {lossEditable ? (
                          <Button variant="sm" onClick={() => setLossOrder(order)}>
                            {t("orders.updateLoss", { defaultValue: "Update Loss" })}
                          </Button>
                        ) : null}
                        {onDelete ? (
                          <Button
                            variant="ghost"
                            tone="delete"
                            onClick={() => void handleDelete(order)}
                          >
                            {t("orders.delete", { defaultValue: "Delete" })}
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                  {renderActions ? <td>{renderActions(order)}</td> : null}
                </tr>
              );
            })}
          </tbody>
      </DataTable>

      {confirmOrder ? (
        <DeliveryConfirmModal
          order={confirmOrder}
          onConfirm={handleConfirmDeliverySubmit}
          onClose={() => setConfirmOrder(null)}
        />
      ) : null}

      {lossOrder ? (
        <LossUpdateModal
          key={lossOrder.id}
          order={lossOrder}
          onConfirm={handleLossUpdateSubmit}
          onClose={() => setLossOrder(null)}
        />
      ) : null}
    </section>
  );
}
