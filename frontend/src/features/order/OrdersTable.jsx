import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useConfirm } from "../../components/ui/ConfirmProvider";

const ORDER_STATUS_FALLBACK = [
  "NEW_ORDER",
  "OWNER_PREPARING",
  "SENT_TO_LOGISTICS_SUPPLIER",
  "OUT_FOR_DELIVERY",
  "RECEIVED_BY_CUSTOMER",
];

export function OrdersTable({ orders, statuses, onUpdateStatus, onConfirmDelivery, readOnly = false, renderActions }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [deliveryInputs, setDeliveryInputs] = useState({});
  const statusRows = Array.isArray(statuses) && statuses.length
    ? statuses
    : ORDER_STATUS_FALLBACK.map((name) => ({ name }));
  const statusOptions = statusRows.map((row) => row.name);

  function getValues(order) {
    return (
      deliveryInputs[order.id] || {
        deliveredQty: order.deliveredQty || order.orderedQty,
        lossQty: order.lossQty || 0,
        remainingQty: order.remainingQty || 0,
        deliveryProofType: "OTP",
        deliveryProofValue: "",
      }
    );
  }

  function setValue(orderId, key, value) {
    setDeliveryInputs((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [key]: Number(value),
      },
    }));
  }

  function setTextValue(orderId, key, value) {
    setDeliveryInputs((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [key]: value,
      },
    }));
  }

  async function handleSaveDelivery(order) {
    const values = getValues(order);
    if (
      !(await confirm({
        title: t("confirm.deliverySaveTitle"),
        message: t("confirm.deliverySaveMessage"),
        tone: "primary",
      }))
    ) {
      return;
    }
    onConfirmDelivery(
      order.id,
      values.deliveredQty,
      values.lossQty,
      values.remainingQty,
      values.deliveryProofType || "OTP",
      values.deliveryProofValue || "",
    );
  }

  const rowMeta =
    orders.length === 1
      ? t("orders.rowOne", { n: orders.length })
      : t("orders.rowMany", { n: orders.length });

  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{t("orders.allOrders")}</h3>
        <p className="panel-meta">{rowMeta}</p>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("orders.customer")}</th>
              <th>{t("orders.item")}</th>
              <th>{t("orders.producer")}</th>
              <th>{t("orders.truck")}</th>
              <th>{t("orders.delivery")}</th>
              <th>{t("orders.qty")}</th>
              <th>{t("orders.status")}</th>
              <th>{t("orders.payment")}</th>
              <th>{t("orders.distributed")}</th>
              <th>{t("orders.loss")}</th>
              <th>{t("orders.remaining")}</th>
              <th>Proof</th>
              <th>{t("orders.saveDelivery")}</th>
              {renderActions ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const values = getValues(order);
              const statusId = `order-status-${order.id}`;
              const deliveredId = `order-delivered-${order.id}`;
              const lossId = `order-loss-${order.id}`;
              const remainingId = `order-remaining-${order.id}`;
              const proofTypeId = `order-proof-type-${order.id}`;
              const proofValueId = `order-proof-value-${order.id}`;
              return (
                <tr key={order.id}>
                  <td>{order.customerName}</td>
                  <td>{order.itemName}</td>
                  <td>{order.producerName || t("orders.dash")}</td>
                  <td>{order.truckCode ? `${order.truckCode}${order.truckPlateNo ? ` (${order.truckPlateNo})` : ""}` : t("orders.dash")}</td>
                  <td>{order.deliveryAgentName || t("orders.dash")}</td>
                  <td>
                    <span className="qty-chip">
                      {order.deliveredQty}/{order.orderedQty}
                    </span>
                  </td>
                  <td>
                    {readOnly ? (
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
                    <span className={`status-chip status-chip--${String(order.paymentStatus).toLowerCase()}`}>
                      {order.paymentStatus}
                    </span>{" "}
                    <span className="money-inline">
                      (${order.amountPaid}/{order.amountTotal})
                    </span>
                  </td>
                  <td>
                    {readOnly ? (
                      values.deliveredQty
                    ) : (
                      <>
                        <label className="form-label" htmlFor={deliveredId}>
                          {t("orders.distributed")}
                        </label>
                        <input
                          id={deliveredId}
                          type="number"
                          min="0"
                          value={values.deliveredQty}
                          onChange={(event) => setValue(order.id, "deliveredQty", event.target.value)}
                        />
                      </>
                    )}
                  </td>
                  <td>
                    {readOnly ? (
                      values.lossQty
                    ) : (
                      <>
                        <label className="form-label" htmlFor={lossId}>
                          {t("orders.loss")}
                        </label>
                        <input
                          id={lossId}
                          type="number"
                          min="0"
                          value={values.lossQty}
                          onChange={(event) => setValue(order.id, "lossQty", event.target.value)}
                        />
                      </>
                    )}
                  </td>
                  <td>
                    {readOnly ? (
                      values.remainingQty
                    ) : (
                      <>
                        <label className="form-label" htmlFor={remainingId}>
                          {t("orders.remaining")}
                        </label>
                        <input
                          id={remainingId}
                          type="number"
                          min="0"
                          value={values.remainingQty}
                          onChange={(event) => setValue(order.id, "remainingQty", event.target.value)}
                        />
                      </>
                    )}
                  </td>
                  <td>
                    {readOnly ? (
                      <span>{order.deliveryProofType && order.deliveryProofValue ? `${order.deliveryProofType}: ${order.deliveryProofValue}` : t("orders.dash")}</span>
                    ) : (
                      <>
                        <label className="form-label" htmlFor={proofTypeId}>Type</label>
                        <select
                          id={proofTypeId}
                          value={values.deliveryProofType || "OTP"}
                          onChange={(event) => setTextValue(order.id, "deliveryProofType", event.target.value)}
                        >
                          <option value="PHOTO">PHOTO</option>
                          <option value="SIGNATURE">SIGNATURE</option>
                          <option value="OTP">OTP</option>
                        </select>
                        <label className="form-label" htmlFor={proofValueId}>Value</label>
                        <input
                          id={proofValueId}
                          value={values.deliveryProofValue || ""}
                          onChange={(event) => setTextValue(order.id, "deliveryProofValue", event.target.value)}
                          placeholder="proof reference / OTP / signature"
                        />
                      </>
                    )}
                  </td>
                  <td>
                    {readOnly ? (
                      <span>{t("orders.dash")}</span>
                    ) : (
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={() => void handleSaveDelivery(order)}
                      >
                        {t("orders.saveDelivery")}
                      </button>
                    )}
                  </td>
                  {renderActions ? <td>{renderActions(order)}</td> : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

