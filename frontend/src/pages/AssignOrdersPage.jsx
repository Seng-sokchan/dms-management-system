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

function formatQty(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : String(value || "—");
}

function buildSubmitGroups(orders, deliveryAgents, t) {
  const deliveryNamesById = new Map(deliveryAgents.map((agent) => [String(agent.id), agent.name]));
  const groups = new Map();

  for (const order of orders) {
    const deliveryAgentId =
      order.deliveryAgentId != null && order.deliveryAgentId !== ""
        ? String(order.deliveryAgentId)
        : "";
    const key = deliveryAgentId || "__unassigned__";
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        deliveryAgentId,
        deliveryLabel: deliveryAgentId
          ? order.deliveryAgentName || deliveryNamesById.get(deliveryAgentId) || t("orders.dash")
          : t("orders.dash"),
        representativeOrderId: order.id,
        orders: [],
        customerIds: new Set(),
        items: new Map(),
      });
    }

    const group = groups.get(key);
    group.orders.push(order);
    group.customerIds.add(order.customerId || order.customerName || order.id);

    const itemKey = order.itemId || order.itemName || order.id;
    const current = group.items.get(itemKey);
    const qty = Number(order.orderedQty);
    if (current) {
      const currentQty = Number(current.qty);
      current.qty =
        Number.isFinite(currentQty) && Number.isFinite(qty) ? currentQty + qty : order.orderedQty;
    } else {
      group.items.set(itemKey, {
        name: order.itemName || t("orders.dash"),
        qty: order.orderedQty,
      });
    }
  }

  return [...groups.values()].map((group) => {
    const itemSummary = [...group.items.values()]
      .map((item) => `${item.name} x${formatQty(item.qty)}`)
      .join(" + ");

    return {
      ...group,
      itemSummary,
      orderCount: group.orders.length,
      customerCount: group.customerIds.size,
    };
  });
}

export function AssignOrdersPage({
  orders = [],
  deliveryAgents = [],
  onAssignDelivery,
  onSubmitToFactory,
}) {
  const { t } = useTranslation();
  const [busyDeliveryId, setBusyDeliveryId] = useState(null);
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
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [eligibleOrders, appliedSearch]);

  const submitGroups = useMemo(
    () => buildSubmitGroups(filteredOrders, deliveryAgents, t),
    [filteredOrders, deliveryAgents, t],
  );

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
    paged: pagedGroupsForSubmit,
    setPage: setSubmitPage,
    setPageSize: setSubmitPageSize,
  } = usePagination(submitGroups, { resetKey: appliedSearch });

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

  async function handleSubmitToFactory(group) {
    if (!onSubmitToFactory) return;
    setBusySubmitId(group.key);
    try {
      await onSubmitToFactory(group.representativeOrderId);
    } finally {
      setBusySubmitId(null);
    }
  }

  const rowMeta =
    filteredOrders.length === 1
      ? t("orders.rowOne", { n: filteredOrders.length })
      : t("orders.rowMany", { n: filteredOrders.length });
  const submitMeta =
    submitGroups.length === 1
      ? t("assignOrders.groupOne", { n: submitGroups.length, defaultValue: "1 driver" })
      : t("assignOrders.groupMany", {
          n: submitGroups.length,
          defaultValue: `${submitGroups.length} drivers`,
        });

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
              </tr>
            ))}
          </tbody>
        </DataTable>

        <h3 className="assign-orders-subpanel-title">{t("assignOrders.submitPanelTitle")}</h3>
        <p className="form-hint">{t("assignOrders.submitPanelHint")}</p>
        <p className="panel-meta assign-orders-submit-meta">{submitMeta}</p>
        <DataTable
          pagination={{
            page: submitPage,
            pageSize: submitPageSize,
            totalRows: submitGroups.length,
            onPageChange: setSubmitPage,
            onPageSizeChange: setSubmitPageSize,
          }}
        >
          <thead>
            <tr>
              <th>{t("assignOrders.currentDelivery")}</th>
              <th>{t("assignOrders.groupSize", { defaultValue: "Group size" })}</th>
              <th>{t("orders.item")}</th>
              <th>{t("orders.status")}</th>
              <th>{t("orders.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {pagedGroupsForSubmit.map((group) => (
              <tr key={`submit-${group.key}`}>
                <td>{group.deliveryLabel}</td>
                <td>
                  {t("assignOrders.groupSizeValue", {
                    orders: group.orderCount,
                    customers: group.customerCount,
                    defaultValue: `${group.orderCount} orders / ${group.customerCount} customers`,
                  })}
                </td>
                <td>{group.itemSummary || t("orders.dash")}</td>
                <td>
                  <span className="status-chip">Owner_Preparing</span>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!group.deliveryAgentId || busySubmitId === group.key}
                    title={
                      group.deliveryAgentId
                        ? undefined
                        : t("assignOrders.assignDeliveryBeforeSubmit", {
                            defaultValue: "Assign a delivery agent before submitting",
                          })
                    }
                    onClick={() => void handleSubmitToFactory(group)}
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
