import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { useConfirm } from "../../components/ui/ConfirmProvider";

const ORDER_STATUS_FALLBACK = [
  "New_Order",
  "Owner Preparing",
  "Ready_For_Delivery",
  "Recieve_By_Customer",
];

export function OrdersTable({ orders, statuses, onUpdateStatus, onConfirmDelivery, readOnly = false, renderActions }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const statusRows = Array.isArray(statuses) && statuses.length
    ? statuses
    : ORDER_STATUS_FALLBACK.map((name) => ({ name }));
  const statusOptions = statusRows.map((row) => row.name);

  async function handleSaveDelivery(order) {
    if (
      !(await confirm({
        title: t("confirm.deliverySaveTitle"),
        message: t("confirm.deliverySaveMessage"),
        tone: "primary",
      }))
    ) {
      return;
    }
    onConfirmDelivery(order.id);
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
      <DataTable>
          <thead>
            <tr>
              <th>{t("orders.customer")}</th>
              <th>{t("orders.item")}</th>
              <th>{t("orders.producer")}</th>
              <th>{t("orders.truck")}</th>
              <th>{t("orders.delivery")}</th>
              <th>{t("orders.qty")}</th>
              <th>{t("orders.status")}</th>
              <th>{t("orders.orderTotal", { defaultValue: "Total" })}</th>
              <th>{t("orders.saveDelivery")}</th>
              {renderActions ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const statusId = `order-status-${order.id}`;
              return (
                <tr key={order.id}>
                  <td>{order.customerName}</td>
                  <td>{order.itemName}</td>
                  <td>{order.producerName || t("orders.dash")}</td>
                  <td>{order.truckCode ? `${order.truckCode}${order.truckPlateNo ? ` (${order.truckPlateNo})` : ""}` : t("orders.dash")}</td>
                  <td>{order.deliveryAgentName || t("orders.dash")}</td>
                  <td>
                    <span className="qty-chip">{order.orderedQty}</span>
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
                    <span className="money-inline">${Number(order.amountTotal || 0).toFixed(2)}</span>
                  </td>
                  <td>
                    {readOnly ? (
                      <span>{t("orders.dash")}</span>
                    ) : (
                      <Button variant="sm" onClick={() => void handleSaveDelivery(order)}>
                        {t("orders.saveDelivery")}
                      </Button>
                    )}
                  </td>
                  {renderActions ? <td>{renderActions(order)}</td> : null}
                </tr>
              );
            })}
          </tbody>
      </DataTable>
    </section>
  );
}
