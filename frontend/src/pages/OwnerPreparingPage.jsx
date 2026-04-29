import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../components/ui/ConfirmProvider";

export function OwnerPreparingPage({
  orders = [],
  orderGroups = [],
  onAssignOrderGroup,
  onConfirmToLogistics,
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [selectedOrderGroupId, setSelectedOrderGroupId] = useState("");
  const preparingOrders = useMemo(
    () => orders.filter((row) => row.status === "OWNER_PREPARING"),
    [orders],
  );

  function resetAssignState() {
    setAssigningOrder(null);
    setSelectedOrderGroupId("");
  }

  function openAssignDialog(order) {
    setAssigningOrder(order);
    setSelectedOrderGroupId(order.orderGroupId || "");
  }

  function requestCloseAssignDialog() {
    resetAssignState();
  }

  async function submitAssign(event) {
    event.preventDefault();
    if (!assigningOrder) return;
    if (
      !(await confirm({
        title: t("confirm.assignGroupTitle"),
        message: t("confirm.assignGroupMessage"),
        tone: "primary",
      }))
    ) {
      return;
    }
    await onAssignOrderGroup(assigningOrder.id, selectedOrderGroupId);
    resetAssignState();
  }

  async function submitConfirm(order) {
    if (!order?.orderGroupId && !order?.orderGroupName) {
      return;
    }
    if (
      !(await confirm({
        title: t("ownerPreparing.confirmTitle", { defaultValue: "Confirm to logistics" }),
        message: t("ownerPreparing.confirmMessage", {
          defaultValue: "Move this order from OWNER_PREPARING to SENT_TO_LOGISTICS_SUPPLIER?",
        }),
        tone: "primary",
      }))
    ) {
      return;
    }
    await onConfirmToLogistics(order.id);
  }

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("ownerPreparing.title", { defaultValue: "Owner Preparing" })}</h2>
        <p className="section-lead">
          {t("ownerPreparing.lead", {
            defaultValue: "Assign order group for orders in OWNER_PREPARING status.",
          })}
        </p>
      </div>
      <section className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("orders.customer")}</th>
                <th>{t("orders.item")}</th>
                <th>{t("orders.qty")}</th>
                <th>{t("ownerPreparing.orderGroup", { defaultValue: "Order Group" })}</th>
                <th>{t("ownerPreparing.action", { defaultValue: "Action" })}</th>
              </tr>
            </thead>
            <tbody>
              {preparingOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.customerName}</td>
                  <td>{order.itemName}</td>
                  <td>{order.orderedQty}</td>
                  <td>{order.orderGroupName || t("orders.dash")}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn-sm" onClick={() => openAssignDialog(order)}>
                        {t("ownerPreparing.assign", { defaultValue: "Assign" })}
                      </button>
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => void submitConfirm(order)}
                        disabled={!order.orderGroupId && !order.orderGroupName}
                      >
                        {t("ownerPreparing.confirmBtn", { defaultValue: "Confirm" })}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {assigningOrder ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="owner-assign-order-group-title">
          <form className="panel form modal-card" onSubmit={submitAssign}>
            <h3 id="owner-assign-order-group-title">
              {t("ownerPreparing.assignTitle", { defaultValue: "Assign Order Group" })}
            </h3>
            <p className="section-lead section-lead--tight">
              {assigningOrder.customerName} - {assigningOrder.itemName}
            </p>
            <label className="form-label" htmlFor="owner-order-group-select">
              {t("ownerPreparing.selectOrderGroup", { defaultValue: "Select order group" })}
            </label>
            <select
              id="owner-order-group-select"
              value={selectedOrderGroupId}
              onChange={(event) => setSelectedOrderGroupId(event.target.value)}
              required
            >
              <option value="">{t("ownerPreparing.selectOrderGroup", { defaultValue: "Select order group" })}</option>
              {orderGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <div className="row-actions">
              <button type="submit" className="btn-primary">
                {t("ownerPreparing.assign", { defaultValue: "Assign" })}
              </button>
              <button type="button" className="btn-ghost btn-cancel" onClick={requestCloseAssignDialog}>
                {t("customers.cancel")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
