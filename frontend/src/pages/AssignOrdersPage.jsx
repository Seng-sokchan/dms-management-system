import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../hooks/usePagination";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { OrdersPivotTable } from "./orders/OrdersPivotTable";
import {
  copyTextToClipboard,
  filterOrdersCreatedToday,
  formatTodayLabel,
  formatTruckCopyText,
  getCustomerKey,
  pivotOrdersByCustomer,
} from "./orders/ordersTodayUtils";
import {
  buildCachedGroup,
  loadCachedGroups,
  resolveGroupOrderIds,
  saveCachedGroups,
} from "./prepareGroupOrderStorage";
import "./OrdersPage.css";
import "./PrepareGroupOrderPage.css";

function compareOrdersByCustomerPriority(a, b, dash, getCustomerKeyFn) {
  const provinceCmp = String(a.customerProvinceName || a.customerProvinceId || "").localeCompare(
    String(b.customerProvinceName || b.customerProvinceId || ""),
  );
  if (provinceCmp !== 0) return provinceCmp;

  const aPrio =
    a.customerPriority != null && Number.isFinite(Number(a.customerPriority))
      ? Number(a.customerPriority)
      : null;
  const bPrio =
    b.customerPriority != null && Number.isFinite(Number(b.customerPriority))
      ? Number(b.customerPriority)
      : null;
  if (aPrio != null && bPrio != null && aPrio !== bPrio) return aPrio - bPrio;
  if (aPrio != null && bPrio == null) return -1;
  if (aPrio == null && bPrio != null) return 1;

  const aLabel = getCustomerKeyFn ? getCustomerKeyFn(a, dash) : String(a.customerName || "");
  const bLabel = getCustomerKeyFn ? getCustomerKeyFn(b, dash) : String(b.customerName || "");
  return aLabel.localeCompare(bLabel);
}

function buildTruckRowFromCachedGroup(group, todayOrders, dash, getCustomerKeyFn) {
  const orderIds = new Set(
    resolveGroupOrderIds(group, todayOrders, dash, getCustomerKeyFn).map(String),
  );
  let rows = (todayOrders || []).filter((order) => orderIds.has(String(order.id)));

  if (rows.length === 0 && group?.customers?.length) {
    const priorityByCustomerKey = new Map();
    for (const order of todayOrders || []) {
      const key = getCustomerKeyFn(order, dash);
      if (!priorityByCustomerKey.has(key) && order.customerPriority != null) {
        priorityByCustomerKey.set(key, {
          customerPriority: Number(order.customerPriority),
          customerProvinceId: order.customerProvinceId ?? null,
          customerProvinceName: order.customerProvinceName ?? null,
        });
      }
    }

    rows = group.customers.flatMap((customer) => {
      const meta = priorityByCustomerKey.get(customer.customerKey) || {};
      return Object.entries(customer.qtyByItem || {}).map(([itemName, qty]) => ({
        customerName: customer.customerLabel || dash,
        customerId: customer.customerKey?.startsWith("id:")
          ? customer.customerKey.slice(3)
          : null,
        itemName,
        orderedQty: qty,
        customerPriority: meta.customerPriority ?? null,
        customerProvinceId: meta.customerProvinceId ?? null,
        customerProvinceName: meta.customerProvinceName ?? null,
      }));
    });
  }

  rows = [...rows].sort((a, b) => compareOrdersByCustomerPriority(a, b, dash, getCustomerKeyFn));

  return {
    truckKey: group.id,
    truckLabel: group.deliveryAgentName || dash,
    rows,
  };
}

function formatGroupTime(iso) {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

function localDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

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
  customers = [],
  deliveryAgents = [],
  onAssignDelivery,
  onSubmitToFactory,
}) {
  const { t, i18n } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedCustomerKeys, setSelectedCustomerKeys] = useState(() => new Set());
  const [cachedGroups, setCachedGroups] = useState(() => loadCachedGroups());
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [assignGroupId, setAssignGroupId] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [agentSearchText, setAgentSearchText] = useState("");
  const [appliedAgentSearch, setAppliedAgentSearch] = useState("");
  const [busyAssignGroupId, setBusyAssignGroupId] = useState(null);
  const [busySubmitId, setBusySubmitId] = useState(null);
  const [copiedGroupId, setCopiedGroupId] = useState(null);

  const dash = t("orders.dash");
  const todayLabel = useMemo(() => formatTodayLabel(), []);
  const todayOrders = useMemo(() => filterOrdersCreatedToday(orders), [orders]);

  const customersById = useMemo(() => {
    const map = new Map();
    for (const customer of customers || []) {
      if (customer?.id == null) continue;
      map.set(String(customer.id), customer);
    }
    return map;
  }, [customers]);

  const pivoted = useMemo(
    () => pivotOrdersByCustomer(todayOrders, dash, customersById),
    [todayOrders, dash, customersById],
  );

  const cachedCustomerKeys = useMemo(() => {
    const keys = new Set();
    for (const group of cachedGroups) {
      for (const key of group.customerKeys || []) keys.add(key);
    }
    return keys;
  }, [cachedGroups]);

  const availableRows = useMemo(
    () => pivoted.rows.filter((row) => !cachedCustomerKeys.has(row.customerKey)),
    [pivoted.rows, cachedCustomerKeys],
  );

  const filteredRows = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return availableRows;
    return availableRows.filter((row) => {
      const itemHits = Object.keys(row.qtyByItem || {}).some((name) =>
        name.toLowerCase().includes(keyword),
      );
      return (
        itemHits ||
        String(row.customerLabel || "").toLowerCase().includes(keyword) ||
        String(row.depotName || "").toLowerCase().includes(keyword)
      );
    });
  }, [availableRows, appliedSearch]);

  const {
    page,
    pageSize,
    paged: pagedRows,
    setPage,
    setPageSize,
  } = usePagination(filteredRows, { resetKey: appliedSearch });

  const activeGroup = useMemo(
    () => cachedGroups.find((group) => group.id === activeGroupId) || null,
    [cachedGroups, activeGroupId],
  );

  const assignGroup = useMemo(
    () => cachedGroups.find((group) => group.id === assignGroupId) || null,
    [cachedGroups, assignGroupId],
  );

  const activeGroupPivot = useMemo(() => {
    if (!activeGroup?.customers?.length) {
      return { itemColumns: [], rows: [] };
    }
    const itemSet = new Set();
    for (const customer of activeGroup.customers) {
      Object.keys(customer.qtyByItem || {}).forEach((item) => itemSet.add(item));
    }
    const itemColumns = Array.from(itemSet).sort((a, b) => a.localeCompare(b));
    const rows = activeGroup.customers.map((customer) => ({
      customerKey: customer.customerKey,
      customerLabel: customer.customerLabel,
      qtyByItem: customer.qtyByItem || {},
    }));
    return { itemColumns, rows };
  }, [activeGroup]);

  const {
    page: groupDetailPage,
    pageSize: groupDetailPageSize,
    paged: pagedGroupDetailRows,
    setPage: setGroupDetailPage,
    setPageSize: setGroupDetailPageSize,
  } = usePagination(activeGroupPivot.rows, { resetKey: activeGroupId || "" });

  const filteredAgents = useMemo(() => {
    const keyword = appliedAgentSearch.trim().toLowerCase();
    const list = [...(deliveryAgents || [])].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" }),
    );
    if (!keyword) return list;
    return list.filter((agent) =>
      [agent.id, agent.name, agent.phone, agent.vehicleType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [deliveryAgents, appliedAgentSearch]);

  const {
    page: agentPage,
    pageSize: agentPageSize,
    paged: pagedAgents,
    setPage: setAgentPage,
    setPageSize: setAgentPageSize,
  } = usePagination(filteredAgents, { resetKey: `${assignGroupId || ""}:${appliedAgentSearch}` });

  const eligibleOrders = useMemo(() => {
    const todayOwnerPreparing = (orders || []).filter(
      (order) => isCreatedToday(order.createdAt) && order.status === "Owner_Preparing",
    );
    return [...todayOwnerPreparing].sort((a, b) => Number(b.id) - Number(a.id));
  }, [orders]);

  const submitGroups = useMemo(
    () => buildSubmitGroups(eligibleOrders, deliveryAgents, t),
    [eligibleOrders, deliveryAgents, t],
  );

  const {
    page: submitPage,
    pageSize: submitPageSize,
    paged: pagedGroupsForSubmit,
    setPage: setSubmitPage,
    setPageSize: setSubmitPageSize,
  } = usePagination(submitGroups, { resetKey: `${eligibleOrders.length}` });

  function persistGroups(nextGroups) {
    setCachedGroups(nextGroups);
    saveCachedGroups(nextGroups);
  }

  function openCreateGroup() {
    setSearchText("");
    setAppliedSearch("");
    setSelectedCustomerKeys(new Set());
    setCreateOpen(true);
  }

  function closeCreateGroup() {
    setCreateOpen(false);
    setSearchText("");
    setAppliedSearch("");
    setSelectedCustomerKeys(new Set());
  }

  function openAssignDelivery(groupId) {
    setAssignGroupId(groupId);
    setSelectedAgentId(null);
    setAgentSearchText("");
    setAppliedAgentSearch("");
  }

  function closeAssignDelivery() {
    if (busyAssignGroupId) return;
    setAssignGroupId(null);
    setSelectedAgentId(null);
    setAgentSearchText("");
    setAppliedAgentSearch("");
  }

  function selectAgent(agentId) {
    const id = String(agentId);
    setSelectedAgentId((prev) => (prev === id ? null : id));
  }

  function toggleCustomerKey(customerKey) {
    setSelectedCustomerKeys((prev) => {
      const next = new Set(prev);
      if (next.has(customerKey)) next.delete(customerKey);
      else next.add(customerKey);
      return next;
    });
  }

  function toggleAllVisible() {
    const visibleKeys = pagedRows.map((row) => row.customerKey);
    setSelectedCustomerKeys((prev) => {
      const next = new Set(prev);
      const allSelected = visibleKeys.length > 0 && visibleKeys.every((key) => next.has(key));
      if (allSelected) {
        visibleKeys.forEach((key) => next.delete(key));
      } else {
        visibleKeys.forEach((key) => next.add(key));
      }
      return next;
    });
  }

  function handleCreateGroup() {
    const selectedRows = availableRows.filter((row) =>
      selectedCustomerKeys.has(row.customerKey),
    );
    if (selectedRows.length === 0) return;

    const group = buildCachedGroup({
      selectedRows,
      todayOrders,
      dash,
      getCustomerKey,
    });
    persistGroups([group, ...cachedGroups]);
    closeCreateGroup();
  }

  function handleRemoveGroup(groupId) {
    const next = cachedGroups.filter((group) => group.id !== groupId);
    persistGroups(next);
    if (activeGroupId === groupId) setActiveGroupId(null);
    if (assignGroupId === groupId) {
      setAssignGroupId(null);
      setSelectedAgentId(null);
    }
  }

  async function handleCopyGroup(group) {
    const truckRow = buildTruckRowFromCachedGroup(group, todayOrders, dash, getCustomerKey);
    const text = formatTruckCopyText(
      truckRow,
      dash,
      i18n.language,
      t("orders.copyTotalAmount"),
    );
    try {
      await copyTextToClipboard(text);
      setCopiedGroupId(group.id);
      window.setTimeout(() => setCopiedGroupId((id) => (id === group.id ? null : id)), 2000);
    } catch {
      setCopiedGroupId(null);
    }
  }

  async function handleSubmitAssignDelivery() {
    if (!assignGroup || !onAssignDelivery || !selectedAgentId) return;
    if (assignGroup.deliveryAgentId) return;

    const agent = (deliveryAgents || []).find(
      (item) => String(item.id) === String(selectedAgentId),
    );
    if (!agent?.id) return;

    const orderIds = resolveGroupOrderIds(assignGroup, todayOrders, dash, getCustomerKey);
    if (orderIds.length === 0) return;

    const groupId = assignGroup.id;
    const agentId = String(agent.id);
    const agentName = agent.name || dash;

    setBusyAssignGroupId(groupId);
    try {
      await onAssignDelivery(orderIds, agentId);
      setCachedGroups((prev) => {
        const next = prev.map((group) =>
          group.id === groupId
            ? {
                ...group,
                deliveryAgentId: agentId,
                deliveryAgentName: agentName,
                orderIds,
                orderCount: orderIds.length,
              }
            : group,
        );
        saveCachedGroups(next);
        return next;
      });
      setAssignGroupId(null);
      setSelectedAgentId(null);
      setAgentSearchText("");
      setAppliedAgentSearch("");
    } finally {
      setBusyAssignGroupId(null);
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

  const selectedCount = selectedCustomerKeys.size;
  const submitMeta =
    submitGroups.length === 1
      ? t("assignOrders.groupOne", { n: submitGroups.length })
      : t("assignOrders.groupMany", { n: submitGroups.length });

  return (
    <section className="admin-page prepare-group-order-page">
      <div className="section-heading">
        <h2>{t("assignOrders.title")}</h2>
        <p className="section-lead">{t("assignOrders.lead")}</p>
        <p className="form-hint">{t("assignOrders.todayOnlyHint", { date: todayLabel })}</p>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>{t("prepareGroupOrder.panelTitle")}</h3>
            <p className="panel-meta">
              {todayOrders.length === 1
                ? t("prepareGroupOrder.orderOne", { n: todayOrders.length })
                : t("prepareGroupOrder.orderMany", { n: todayOrders.length })}
              {" · "}
              {availableRows.length === 1
                ? t("prepareGroupOrder.availableCustomerOne", { n: availableRows.length })
                : t("prepareGroupOrder.availableCustomerMany", { n: availableRows.length })}
            </p>
          </div>
          <Button onClick={openCreateGroup}>{t("prepareGroupOrder.createGroup")}</Button>
        </div>
        <p className="form-hint prepare-group-order-page__hint">
          {t("prepareGroupOrder.panelHint")}
        </p>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>{t("prepareGroupOrder.cachedGroupsTitle")}</h3>
            <p className="panel-meta">
              {cachedGroups.length === 1
                ? t("prepareGroupOrder.groupOne", { n: cachedGroups.length })
                : t("prepareGroupOrder.groupMany", { n: cachedGroups.length })}
            </p>
          </div>
        </div>
        {cachedGroups.length === 0 ? (
          <p className="form-hint">{t("prepareGroupOrder.noCachedGroups")}</p>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>{t("prepareGroupOrder.groupName")}</th>
                <th>{t("prepareGroupOrder.customers")}</th>
                <th>{t("prepareGroupOrder.orderLines")}</th>
                <th>{t("prepareGroupOrder.delivery")}</th>
                <th>{t("prepareGroupOrder.createdAt")}</th>
                <th>{t("orders.actions", { defaultValue: "Actions" })}</th>
              </tr>
            </thead>
            <tbody>
              {cachedGroups.map((group, index) => {
                const hasDelivery = Boolean(group.deliveryAgentId);
                const assigning = busyAssignGroupId === group.id;
                return (
                  <tr key={group.id}>
                    <td>{t("prepareGroupOrder.groupLabel", { n: cachedGroups.length - index })}</td>
                    <td>
                      <span className="qty-chip">
                        {group.customerCount || group.customers?.length || 0}
                      </span>
                    </td>
                    <td>
                      <span className="qty-chip">
                        {group.orderCount || group.orderIds?.length || 0}
                      </span>
                    </td>
                    <td>
                      {hasDelivery ? (
                        <span className="status-chip">
                          {group.deliveryAgentName || dash}
                        </span>
                      ) : (
                        dash
                      )}
                    </td>
                    <td>{formatGroupTime(group.createdAt) || dash}</td>
                    <td className="prepare-group-order-page__actions">
                      <Button variant="sm" onClick={() => setActiveGroupId(group.id)}>
                        {t("orders.view", { defaultValue: "View" })}
                      </Button>
                      <Button variant="sm" onClick={() => void handleCopyGroup(group)}>
                        {copiedGroupId === group.id
                          ? t("orders.copyTruckDone")
                          : t("orders.copyTruck")}
                      </Button>
                      {hasDelivery ? (
                        <span
                          className="prepare-group-order-assigned-badge"
                          title={t("prepareGroupOrder.alreadyAssignedHint")}
                        >
                          {t("prepareGroupOrder.assignedBadge")}
                        </span>
                      ) : (
                        <Button
                          variant="sm"
                          disabled={assigning || !onAssignDelivery}
                          onClick={() => openAssignDelivery(group.id)}
                        >
                          {assigning
                            ? t("prepareGroupOrder.assigning")
                            : t("prepareGroupOrder.assignDelivery")}
                        </Button>
                      )}
                      <Button
                        variant="sm"
                        tone="cancel"
                        disabled={assigning}
                        onClick={() => handleRemoveGroup(group.id)}
                      >
                        {t("prepareGroupOrder.removeGroup")}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>{t("assignOrders.submitPanelTitle")}</h3>
          <p className="panel-meta">{submitMeta}</p>
        </div>
        <p className="form-hint">{t("assignOrders.submitPanelHint")}</p>
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

      {createOpen ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prepare-group-order-create-title"
        >
          <section className="panel modal-card modal-card--orders-truck modal-card--orders-pivot prepare-group-order-modal">
            <div className="panel-header">
              <h3 id="prepare-group-order-create-title">
                {t("prepareGroupOrder.createModalTitle")}
              </h3>
              <Button variant="ghost" tone="cancel" onClick={closeCreateGroup}>
                {t("prepareGroupOrder.close")}
              </Button>
            </div>
            <p className="form-hint">
              {t("prepareGroupOrder.createModalHint", { date: todayLabel })}
            </p>

            {availableRows.length === 0 ? (
              <p className="form-hint">
                {pivoted.rows.length === 0
                  ? t("prepareGroupOrder.noOrdersToday")
                  : t("prepareGroupOrder.allCustomersGrouped")}
              </p>
            ) : (
              <>
                <div className="prepare-group-order-modal__body">
                  <OrdersPivotTable
                    itemColumns={pivoted.itemColumns}
                    pagedRows={pagedRows}
                    allRows={filteredRows}
                    dash={dash}
                    customerHeader={t("orders.customer")}
                    depotHeader={t("customers.depot")}
                    totalLabel={t("orders.totalAll", { defaultValue: "Total" })}
                    pagination={{
                      page,
                      pageSize,
                      totalRows: filteredRows.length,
                      onPageChange: setPage,
                      onPageSizeChange: setPageSize,
                    }}
                    showSearch
                    searchValue={searchText}
                    onSearchValueChange={setSearchText}
                    onSearch={() => setAppliedSearch(searchText)}
                    searchPlaceholder={t("prepareGroupOrder.searchPlaceholder")}
                    searchButtonLabel={t("common.search", { defaultValue: "Search" })}
                    selectable
                    selectedKeys={selectedCustomerKeys}
                    onToggleKey={toggleCustomerKey}
                    onToggleAllVisible={toggleAllVisible}
                    selectAllLabel={t("prepareGroupOrder.selectAll")}
                    selectRowLabel={(row) =>
                      t("prepareGroupOrder.selectCustomer", { name: row.customerLabel })
                    }
                    checkColClassName="prepare-group-order-check-col"
                  />
                </div>
                <div className="prepare-group-order-modal-footer">
                  <p className="panel-meta">
                    {t("prepareGroupOrder.selectedCount", { count: selectedCount })}
                  </p>
                  <div className="prepare-group-order-modal-actions">
                    <Button
                      type="button"
                      variant="ghost"
                      tone="cancel"
                      onClick={closeCreateGroup}
                    >
                      {t("prepareGroupOrder.cancel")}
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      disabled={selectedCount === 0}
                      onClick={handleCreateGroup}
                    >
                      {t("prepareGroupOrder.create", { count: selectedCount })}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}

      {assignGroup && !assignGroup.deliveryAgentId ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prepare-group-order-assign-title"
        >
          <section className="panel modal-card prepare-group-order-assign-modal">
            <div className="panel-header">
              <h3 id="prepare-group-order-assign-title">
                {t("prepareGroupOrder.assignModalTitle")}
              </h3>
              <Button
                variant="ghost"
                tone="cancel"
                disabled={Boolean(busyAssignGroupId)}
                onClick={closeAssignDelivery}
              >
                {t("prepareGroupOrder.close")}
              </Button>
            </div>
            <p className="form-hint">
              {t("prepareGroupOrder.assignModalHint", {
                orders: resolveGroupOrderIds(assignGroup, todayOrders, dash, getCustomerKey).length,
                customers: assignGroup.customerCount || assignGroup.customers?.length || 0,
              })}
            </p>
            <div className="prepare-group-order-assign-modal__body">
              <DataTable
                className="prepare-group-order-assign-table-wrap"
                tableClassName="prepare-group-order-assign-table"
                showSearch
                searchValue={agentSearchText}
                onSearchValueChange={setAgentSearchText}
                onSearch={() => setAppliedAgentSearch(agentSearchText)}
                searchPlaceholder={t("prepareGroupOrder.searchDeliveriesPlaceholder")}
                searchButtonLabel={t("common.search", { defaultValue: "Search" })}
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
                    <th className="prepare-group-order-check-col">
                      {t("prepareGroupOrder.select", { defaultValue: "Select" })}
                    </th>
                    <th>{t("orders.delivery", { defaultValue: "Delivery" })}</th>
                    <th>{t("prepareGroupOrder.phone", { defaultValue: "Phone" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedAgents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="entity-list-empty">
                        {t("prepareGroupOrder.noDeliveries")}
                      </td>
                    </tr>
                  ) : (
                    pagedAgents.map((agent) => {
                      const agentId = String(agent.id);
                      const checked = selectedAgentId === agentId;
                      return (
                        <tr
                          key={agent.id}
                          className={
                            checked ? "prepare-group-order-assign-row--selected" : undefined
                          }
                        >
                          <td className="prepare-group-order-check-col">
                            <input
                              type="checkbox"
                              aria-label={t("prepareGroupOrder.selectDelivery", {
                                name: agent.name || dash,
                              })}
                              checked={checked}
                              disabled={Boolean(busyAssignGroupId)}
                              onChange={() => selectAgent(agentId)}
                            />
                          </td>
                          <td>{agent.name || dash}</td>
                          <td>{agent.phone || dash}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </DataTable>
            </div>
            <div className="prepare-group-order-modal-footer">
              <p className="panel-meta">
                {selectedAgentId
                  ? t("prepareGroupOrder.selectedDelivery", {
                      name:
                        (deliveryAgents || []).find(
                          (agent) => String(agent.id) === String(selectedAgentId),
                        )?.name || dash,
                    })
                  : t("prepareGroupOrder.selectDeliveryHint")}
              </p>
              <div className="prepare-group-order-modal-actions">
                <Button
                  type="button"
                  variant="ghost"
                  tone="cancel"
                  disabled={Boolean(busyAssignGroupId)}
                  onClick={closeAssignDelivery}
                >
                  {t("prepareGroupOrder.cancel")}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={!selectedAgentId || Boolean(busyAssignGroupId)}
                  onClick={() => void handleSubmitAssignDelivery()}
                >
                  {busyAssignGroupId
                    ? t("prepareGroupOrder.assigning")
                    : t("prepareGroupOrder.submitAssign")}
                </Button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {activeGroup ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prepare-group-order-view-title"
        >
          <section className="panel modal-card modal-card--orders-truck modal-card--orders-pivot prepare-group-order-modal">
            <div className="panel-header">
              <h3 id="prepare-group-order-view-title">
                {t("prepareGroupOrder.viewGroupTitle", {
                  count: activeGroup.customerCount || activeGroup.customers?.length || 0,
                })}
              </h3>
              <Button variant="ghost" tone="cancel" onClick={() => setActiveGroupId(null)}>
                {t("prepareGroupOrder.close")}
              </Button>
            </div>
            <p className="form-hint">
              {t("prepareGroupOrder.viewGroupHint", {
                orders: activeGroup.orderCount || activeGroup.orderIds?.length || 0,
                time: formatGroupTime(activeGroup.createdAt) || dash,
              })}
              {activeGroup.deliveryAgentId
                ? ` · ${t("prepareGroupOrder.deliveryAssignedTo", {
                    name: activeGroup.deliveryAgentName || dash,
                  })}`
                : ""}
            </p>
            <div className="prepare-group-order-modal__body">
              <OrdersPivotTable
                itemColumns={activeGroupPivot.itemColumns}
                pagedRows={pagedGroupDetailRows}
                allRows={activeGroupPivot.rows}
                dash={dash}
                customerHeader={t("orders.customer")}
                totalLabel={t("orders.totalAll", { defaultValue: "Total" })}
                pagination={{
                  page: groupDetailPage,
                  pageSize: groupDetailPageSize,
                  totalRows: activeGroupPivot.rows.length,
                  onPageChange: setGroupDetailPage,
                  onPageSizeChange: setGroupDetailPageSize,
                }}
              />
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
