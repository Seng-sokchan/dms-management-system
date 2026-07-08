import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../hooks/usePagination";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import "./AssignOrdersPage.css";

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

function currentDeliveryLabel(order, t) {
  if (order.deliveryAgentName) {
    return order.deliveryAgentName;
  }
  return t("orders.dash");
}

function buildSubmitGroups(orders, deliveryAgents, t) {
  const deliveryNamesById = new Map(deliveryAgents.map((agent) => [String(agent.id), agent.name]));
  const groups = new Map();

  for (const order of orders) {
    const deliveryAgentId =
      order.deliveryAgentId != null && order.deliveryAgentId !== ""
        ? String(order.deliveryAgentId)
        : "";
    if (!deliveryAgentId) continue;

    if (!groups.has(deliveryAgentId)) {
      groups.set(deliveryAgentId, {
        key: deliveryAgentId,
        deliveryAgentId,
        deliveryLabel:
          order.deliveryAgentName || deliveryNamesById.get(deliveryAgentId) || t("orders.dash"),
        representativeOrderId: order.id,
        orders: [],
        customerIds: new Set(),
        items: new Map(),
      });
    }

    const group = groups.get(deliveryAgentId);
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
  const [busyAgentId, setBusyAgentId] = useState(null);
  const [busySubmitId, setBusySubmitId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [assignAgent, setAssignAgent] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState(() => new Set());
  const [orderSearchText, setOrderSearchText] = useState("");
  const [appliedOrderSearch, setAppliedOrderSearch] = useState("");

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

  const assignedCountByAgentId = useMemo(() => {
    const counts = new Map();
    for (const order of eligibleOrders) {
      const agentId =
        order.deliveryAgentId != null && order.deliveryAgentId !== ""
          ? String(order.deliveryAgentId)
          : "";
      if (!agentId) continue;
      counts.set(agentId, (counts.get(agentId) || 0) + 1);
    }
    return counts;
  }, [eligibleOrders]);

  const filteredAgents = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    const list = [...(deliveryAgents || [])].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" }),
    );
    if (!keyword) return list;
    return list.filter((agent) =>
      [agent.id, agent.name, agent.phone, agent.vehicleType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [deliveryAgents, appliedSearch]);

  const submitGroups = useMemo(
    () => buildSubmitGroups(eligibleOrders, deliveryAgents, t),
    [eligibleOrders, deliveryAgents, t],
  );

  const modalOrders = useMemo(() => {
    const keyword = appliedOrderSearch.trim().toLowerCase();
    if (!keyword) return eligibleOrders;
    return eligibleOrders.filter((order) =>
      [order.id, order.customerName, order.itemName, order.status, order.deliveryAgentName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [eligibleOrders, appliedOrderSearch]);

  const {
    page: agentPage,
    pageSize: agentPageSize,
    paged: pagedAgents,
    setPage: setAgentPage,
    setPageSize: setAgentPageSize,
  } = usePagination(filteredAgents, { resetKey: appliedSearch });

  const {
    page: submitPage,
    pageSize: submitPageSize,
    paged: pagedGroupsForSubmit,
    setPage: setSubmitPage,
    setPageSize: setSubmitPageSize,
  } = usePagination(submitGroups, { resetKey: `${eligibleOrders.length}` });

  const {
    page: orderPage,
    pageSize: orderPageSize,
    paged: pagedModalOrders,
    setPage: setOrderPage,
    setPageSize: setOrderPageSize,
  } = usePagination(modalOrders, {
    resetKey: `${assignAgent?.id || ""}:${appliedOrderSearch}`,
  });

  function openAssignModal(agent) {
    setAssignAgent(agent);
    setSelectedOrderIds(new Set());
    setOrderSearchText("");
    setAppliedOrderSearch("");
  }

  function closeAssignModal() {
    if (busyAgentId) return;
    setAssignAgent(null);
    setSelectedOrderIds(new Set());
    setOrderSearchText("");
    setAppliedOrderSearch("");
  }

  function toggleOrderSelected(orderId) {
    const id = String(orderId);
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    const visibleIds = pagedModalOrders.map((order) => String(order.id));
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => next.has(id));
      if (allVisibleSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  }

  async function handleConfirmAssign() {
    if (!assignAgent || !onAssignDelivery) return;
    const orderIds = [...selectedOrderIds];
    if (orderIds.length === 0) return;

    setBusyAgentId(String(assignAgent.id));
    try {
      await onAssignDelivery(orderIds, String(assignAgent.id));
      setAssignAgent(null);
      setSelectedOrderIds(new Set());
      setOrderSearchText("");
      setAppliedOrderSearch("");
    } finally {
      setBusyAgentId(null);
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

  const agentMeta =
    filteredAgents.length === 1
      ? t("assignOrders.deliveryOne", { n: filteredAgents.length })
      : t("assignOrders.deliveryMany", { n: filteredAgents.length });
  const submitMeta =
    submitGroups.length === 1
      ? t("assignOrders.groupOne", { n: submitGroups.length })
      : t("assignOrders.groupMany", { n: submitGroups.length });

  const selectedCount = selectedOrderIds.size;
  const visibleIds = pagedModalOrders.map((order) => String(order.id));
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedOrderIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedOrderIds.has(id));

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("assignOrders.title")}</h2>
        <p className="section-lead">{t("assignOrders.lead")}</p>
        <p className="form-hint">{t("assignOrders.todayOnlyHint", { date: todayLabel })}</p>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h3>{t("assignOrders.deliveryPanelTitle")}</h3>
          <p className="panel-meta">{agentMeta}</p>
        </div>
        <p className="form-hint">{t("assignOrders.deliveryPanelHint")}</p>
        <DataTable
          showSearch
          searchValue={searchText}
          onSearchValueChange={setSearchText}
          onSearch={() => setAppliedSearch(searchText)}
          searchPlaceholder={t("assignOrders.searchDeliveriesPlaceholder")}
          searchButtonLabel={t("common.search")}
          pagination={{
            page: agentPage,
            pageSize: agentPageSize,
            totalRows: filteredAgents.length,
            onPageChange: setAgentPage,
            onPageSizeChange: setAgentPageSize,
          }}
        >
          <thead>
            <tr>
              <th>{t("deliveryAgents.namePh")}</th>
              <th>{t("deliveryAgents.phonePh")}</th>
              <th>{t("deliveryAgents.vehiclePh")}</th>
              <th>{t("assignOrders.assignedToday")}</th>
              <th>{t("orders.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {pagedAgents.map((agent) => {
              const assignedCount = assignedCountByAgentId.get(String(agent.id)) || 0;
              return (
                <tr key={`delivery-${agent.id}`}>
                  <td>{agent.name || t("orders.dash")}</td>
                  <td>{agent.phone || t("orders.dash")}</td>
                  <td>{agent.vehicleType || t("orders.dash")}</td>
                  <td>
                    {t("assignOrders.assignedTodayValue", {
                      count: assignedCount,
                    })}
                  </td>
                  <td>
                    <Button
                      type="button"
                      variant="primary"
                      disabled={busyAgentId === String(agent.id)}
                      onClick={() => openAssignModal(agent)}
                    >
                      {t("assignOrders.assignButton")}
                    </Button>
                  </td>
                </tr>
              );
            })}
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
              <th>{t("assignOrders.groupSize")}</th>
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
                        : t("assignOrders.assignDeliveryBeforeSubmit")
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

      {assignAgent ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-orders-modal-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeAssignModal();
          }}
        >
          <div className="modal-card panel assign-orders-modal">
            <div className="panel-header">
              <h3 id="assign-orders-modal-title">
                {t("assignOrders.assignModalTitle", {
                  name: deliveryAgentOptionLabel(assignAgent),
                })}
              </h3>
              <Button type="button" variant="ghost" disabled={Boolean(busyAgentId)} onClick={closeAssignModal}>
                {t("assignOrders.close")}
              </Button>
            </div>
            <p className="form-hint">{t("assignOrders.assignModalHint", { date: todayLabel })}</p>

            <DataTable
              showSearch
              searchValue={orderSearchText}
              onSearchValueChange={setOrderSearchText}
              onSearch={() => setAppliedOrderSearch(orderSearchText)}
              searchPlaceholder={t("assignOrders.searchOrdersPlaceholder")}
              searchButtonLabel={t("common.search")}
              pagination={{
                page: orderPage,
                pageSize: orderPageSize,
                totalRows: modalOrders.length,
                onPageChange: setOrderPage,
                onPageSizeChange: setOrderPageSize,
              }}
            >
              <thead>
                <tr>
                  <th className="assign-orders-check-col">
                    <input
                      type="checkbox"
                      aria-label={t("assignOrders.selectAll")}
                      checked={allVisibleSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected;
                      }}
                      disabled={pagedModalOrders.length === 0 || Boolean(busyAgentId)}
                      onChange={toggleSelectAllVisible}
                    />
                  </th>
                  <th>{t("orders.customer")}</th>
                  <th>{t("orders.item")}</th>
                  <th>{t("orders.status")}</th>
                  <th>{t("assignOrders.currentDelivery")}</th>
                </tr>
              </thead>
              <tbody>
                {pagedModalOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="entity-list-empty">
                      {t("assignOrders.noOrdersToday")}
                    </td>
                  </tr>
                ) : (
                  pagedModalOrders.map((order) => {
                    const id = String(order.id);
                    const checked = selectedOrderIds.has(id);
                    return (
                      <tr key={`modal-order-${order.id}`}>
                        <td className="assign-orders-check-col">
                          <input
                            type="checkbox"
                            aria-label={t("assignOrders.selectOrder", { id: order.id })}
                            checked={checked}
                            disabled={Boolean(busyAgentId)}
                            onChange={() => toggleOrderSelected(order.id)}
                          />
                        </td>
                        <td>{order.customerName || t("orders.dash")}</td>
                        <td>
                          {order.itemName
                            ? `#${order.id} · ${order.itemName} ×${formatQty(order.orderedQty)}`
                            : `#${order.id}`}
                        </td>
                        <td>
                          <span className="status-chip">{order.status}</span>
                        </td>
                        <td>{currentDeliveryLabel(order, t)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </DataTable>

            <div className="assign-orders-modal-footer">
              <p className="panel-meta">
                {t("assignOrders.selectedCount", { count: selectedCount })}
              </p>
              <div className="assign-orders-modal-actions">
                <Button type="button" variant="ghost" tone="cancel" disabled={Boolean(busyAgentId)} onClick={closeAssignModal}>
                  {t("assignOrders.cancel")}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={selectedCount === 0 || Boolean(busyAgentId)}
                  onClick={() => void handleConfirmAssign()}
                >
                  {busyAgentId
                    ? t("assignOrders.assigning")
                    : t("assignOrders.confirmAssign", { count: selectedCount })}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
