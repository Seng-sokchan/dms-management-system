import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../hooks/usePagination";
import { DataTable } from "../components/ui/DataTable";
import "./AssignOrdersPage.css";

function currentDeliveryLabel(order, t) {
  if (order.deliveryAgentName) {
    return order.deliveryAgentName;
  }
  return t("orders.dash");
}

function deliveryAgentOptionLabel(agent) {
  const phone = agent.phone?.trim();
  return phone ? `${agent.name} (${phone})` : agent.name;
}

function localDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/** True when created_at is on the user's local calendar day. */
function isCreatedToday(createdAt) {
  if (createdAt == null || createdAt === "") return false;
  const raw = String(createdAt).trim();
  const datePart = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart === localDateKey(new Date());
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return false;
  return localDateKey(parsed) === localDateKey(new Date());
}

export function AssignOrdersPage({
  orders = [],
  deliveryAgents = [],
  orderGroups = [],
  onAssignDelivery,
  onAssignOrderGroup,
  onSubmitToFactory,
}) {
  const { t } = useTranslation();
  const [busyDeliveryId, setBusyDeliveryId] = useState(null);
  const [busyGroupId, setBusyGroupId] = useState(null);
  const [busySubmitId, setBusySubmitId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [],
  );

  const eligibleOrders = useMemo(() => {
    const todayOwnerPreparing = (orders || []).filter(
      (order) => isCreatedToday(order.createdAt) && order.status === "Owner_Preparing",
    );
    return [...todayOwnerPreparing].sort((a, b) => Number(b.id) - Number(a.id));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return eligibleOrders;
    return eligibleOrders.filter((order) =>
      [
        order.id,
        order.customerName,
        order.itemName,
        order.status,
        order.deliveryAgentName,
        order.orderGroupName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [eligibleOrders, appliedSearch]);

  const {
    page: assignPage,
    pageSize: assignPageSize,
    paged: pagedOrdersForAssign,
    setPage: setAssignPage,
    setPageSize: setAssignPageSize,
  } = usePagination(filteredOrders, { resetKey: appliedSearch });
  const {
    page: submitPage,
    pageSize: submitPageSize,
    paged: pagedOrdersForSubmit,
    setPage: setSubmitPage,
    setPageSize: setSubmitPageSize,
  } = usePagination(filteredOrders, { resetKey: appliedSearch });

  async function handleDeliveryChange(order, deliveryAgentId) {
    const next = deliveryAgentId || null;
    const cur =
      order.deliveryAgentId != null && order.deliveryAgentId !== ""
        ? String(order.deliveryAgentId)
        : "";
    if ((next || "") === cur) return;
    if (!next) return;
    setBusyDeliveryId(order.id);
    try {
      await onAssignDelivery(order.id, next);
    } finally {
      setBusyDeliveryId(null);
    }
  }

  async function handleGroupChange(order, orderGroupId) {
    const next = orderGroupId || null;
    const cur =
      order.orderGroupId != null && order.orderGroupId !== "" ? String(order.orderGroupId) : "";
    if ((next || "") === cur) return;
    if (!next) return;
    setBusyGroupId(order.id);
    try {
      await onAssignOrderGroup(order.id, next);
    } finally {
      setBusyGroupId(null);
    }
  }

  async function handleSubmitToFactory(orderId) {
    if (!onSubmitToFactory) return;
    setBusySubmitId(orderId);
    try {
      await onSubmitToFactory(orderId);
    } finally {
      setBusySubmitId(null);
    }
  }

  const rowMeta =
    filteredOrders.length === 1
      ? t("orders.rowOne", { n: filteredOrders.length })
      : t("orders.rowMany", { n: filteredOrders.length });

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("assignOrders.title")}</h2>
        <p className="section-lead">{t("assignOrders.lead")}</p>
        <p className="form-hint">{t("assignOrders.todayOnlyHint", { date: todayLabel })}</p>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h3>{t("assignOrders.assignPanelTitle")}</h3>
          <p className="panel-meta">{rowMeta}</p>
        </div>
        <p className="form-hint">{t("assignOrders.assignPanelHint")}</p>
        <DataTable
          showSearch
          searchValue={searchText}
          onSearchValueChange={setSearchText}
          onSearch={() => setAppliedSearch(searchText)}
          searchPlaceholder={t("assignOrders.searchPlaceholder", { defaultValue: "Search orders..." })}
          searchButtonLabel={t("common.search", { defaultValue: "Search" })}
          pagination={{
            page: assignPage,
            pageSize: assignPageSize,
            totalRows: filteredOrders.length,
            onPageChange: setAssignPage,
            onPageSizeChange: setAssignPageSize,
          }}
        >
          <thead>
            <tr>
              <th>{t("orders.customer")}</th>
              <th>{t("orders.item")}</th>
              <th>{t("orders.status")}</th>
              <th>{t("assignOrders.currentDelivery")}</th>
              <th>{t("assignOrders.assignDelivery")}</th>
              <th>{t("assignOrders.currentGroup")}</th>
              <th>{t("assignOrders.assignGroup")}</th>
            </tr>
          </thead>
          <tbody>
            {pagedOrdersForAssign.map((order) => (
              <tr key={`assign-${order.id}`}>
                <td>{order.customerName || t("orders.dash")}</td>
                <td>{order.itemName ? `#${order.id} · ${order.itemName}` : `#${order.id}`}</td>
                <td>
                  <span className="status-chip">{order.status}</span>
                </td>
                <td>{currentDeliveryLabel(order, t)}</td>
                <td>
                  <select
                    aria-label={t("assignOrders.assignDelivery")}
                    value={
                      order.deliveryAgentId != null && order.deliveryAgentId !== ""
                        ? String(order.deliveryAgentId)
                        : ""
                    }
                    disabled={busyDeliveryId === order.id}
                    onChange={(event) => void handleDeliveryChange(order, event.target.value)}
                  >
                    <option value="">{t("assignOrders.selectDeliveryPlaceholder")}</option>
                    {deliveryAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {deliveryAgentOptionLabel(agent)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{order.orderGroupName || t("orders.dash")}</td>
                <td>
                  <select
                    aria-label={t("assignOrders.assignGroup")}
                    value={
                      order.orderGroupId != null && order.orderGroupId !== ""
                        ? String(order.orderGroupId)
                        : ""
                    }
                    disabled={busyGroupId === order.id}
                    onChange={(event) => void handleGroupChange(order, event.target.value)}
                  >
                    <option value="">{t("assignOrders.selectGroupPlaceholder")}</option>
                    {orderGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>

        <h3 className="assign-orders-subpanel-title">{t("assignOrders.submitPanelTitle")}</h3>
        <p className="form-hint">{t("assignOrders.submitPanelHint")}</p>
        <p className="panel-meta assign-orders-submit-meta">{rowMeta}</p>
        <DataTable
          pagination={{
            page: submitPage,
            pageSize: submitPageSize,
            totalRows: filteredOrders.length,
            onPageChange: setSubmitPage,
            onPageSizeChange: setSubmitPageSize,
          }}
        >
          <thead>
            <tr>
              <th>{t("orders.customer")}</th>
              <th>{t("orders.item")}</th>
              <th>{t("orders.status")}</th>
              <th>{t("orders.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {pagedOrdersForSubmit.map((order) => (
              <tr key={`submit-${order.id}`}>
                <td>{order.customerName || t("orders.dash")}</td>
                <td>{order.itemName ? `#${order.id} · ${order.itemName}` : `#${order.id}`}</td>
                <td>
                  <span className="status-chip">{order.status}</span>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busySubmitId === order.id}
                    onClick={() => void handleSubmitToFactory(order.id)}
                  >
                    {t("assignOrders.submitToFactoryButton")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>
    </section>
  );
}
