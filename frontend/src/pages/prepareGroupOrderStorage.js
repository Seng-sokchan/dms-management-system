import { localDateKey } from "./orders/ordersTodayUtils";

const STORAGE_KEY = "dms-prepare-group-orders";

function safeParse(raw) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadCachedGroups() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return safeParse(raw).filter((group) => group?.id && Array.isArray(group.customers));
  } catch {
    return [];
  }
}

export function saveCachedGroups(groups) {
  try {
    if (!groups?.length) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch {
    /* private mode or quota */
  }
}

export function createGroupId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Build a cacheable group from selected pivot rows + today's order lines. */
export function buildCachedGroup({
  selectedRows,
  todayOrders,
  dash,
  getCustomerKey,
}) {
  const selectedKeys = new Set(selectedRows.map((row) => row.customerKey));
  const orderIds = [];
  const customers = selectedRows.map((row) => {
    const matchingOrders = (todayOrders || []).filter(
      (order) => getCustomerKey(order, dash) === row.customerKey,
    );
    const ids = matchingOrders.map((order) => String(order.id)).filter(Boolean);
    orderIds.push(...ids);
    return {
      customerKey: row.customerKey,
      customerLabel: row.customerLabel,
      qtyByItem: { ...(row.qtyByItem || {}) },
      orderIds: ids,
    };
  });

  return {
    id: createGroupId(),
    createdAt: new Date().toISOString(),
    dateKey: localDateKey(new Date()),
    customerKeys: [...selectedKeys],
    customers,
    orderIds,
    customerCount: customers.length,
    orderCount: orderIds.length,
    deliveryAgentId: null,
    deliveryAgentName: null,
  };
}

export function resolveGroupOrderIds(group, todayOrders, dash, getCustomerKeyFn) {
  const fromCache = (group?.orderIds || []).map((id) => String(id)).filter(Boolean);
  if (fromCache.length > 0) return [...new Set(fromCache)];

  const keys = new Set(group?.customerKeys || []);
  if (keys.size === 0 || !todayOrders?.length) return [];

  return [
    ...new Set(
      todayOrders
        .filter((order) => keys.has(getCustomerKeyFn(order, dash)))
        .map((order) => String(order.id))
        .filter(Boolean),
    ),
  ];
}
