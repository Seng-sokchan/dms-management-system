import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../hooks/usePagination";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import "./OrdersPage.css";

function buildAgentLookup(deliveryAgents) {
  const map = new Map();
  (deliveryAgents || []).forEach((a) => {
    if (a?.id != null) map.set(String(a.id), a);
  });
  return map;
}

function getCustomerLabelForCopy(order, dash) {
  const name =
    order.customerName != null && String(order.customerName).trim() !== ""
      ? String(order.customerName).trim()
      : null;
  return name || dash;
}

function getCustomerLabel(order, dash) {
  const fromDirectory =
    order.customerDirectoryName != null && String(order.customerDirectoryName).trim() !== ""
      ? String(order.customerDirectoryName).trim()
      : null;
  if (fromDirectory) return fromDirectory;
  return getCustomerLabelForCopy(order, dash);
}

function getCustomerKey(order, dash) {
  if (order.customerId != null && String(order.customerId).trim() !== "") {
    return `id:${order.customerId}`;
  }
  return `name:${getCustomerLabel(order, dash)}`;
}

/**
 * Pivot orders into one row per customer with item names as columns.
 * @returns {{ itemColumns: string[], rows: Array<{ customerKey: string, customerLabel: string, qtyByItem: Record<string, number> }> }}
 */
function pivotOrdersByCustomer(orders, dash) {
  const itemSet = new Set();
  const rowMap = new Map();

  for (const order of orders || []) {
    const itemName = order.itemName != null ? String(order.itemName).trim() : "";
    if (itemName) {
      itemSet.add(itemName);
    }

    const customerKey = getCustomerKey(order, dash);
    if (!rowMap.has(customerKey)) {
      rowMap.set(customerKey, {
        customerKey,
        customerLabel: getCustomerLabel(order, dash),
        qtyByItem: {},
      });
    }

    if (!itemName) continue;
    const row = rowMap.get(customerKey);
    const qty = Number(order.orderedQty || 0);
    row.qtyByItem[itemName] = (row.qtyByItem[itemName] || 0) + qty;
  }

  const itemColumns = Array.from(itemSet).sort((a, b) => a.localeCompare(b));
  const rows = Array.from(rowMap.values()).sort((a, b) =>
    a.customerLabel.localeCompare(b.customerLabel),
  );

  return { itemColumns, rows };
}

function sumRowQty(row, itemColumns) {
  return itemColumns.reduce((sum, item) => sum + Number(row.qtyByItem[item] || 0), 0);
}

function computePivotTotals(rows, itemColumns) {
  const totalsByItem = Object.fromEntries(itemColumns.map((item) => [item, 0]));
  let grandTotal = 0;
  for (const row of rows || []) {
    for (const item of itemColumns) {
      const qty = Number(row.qtyByItem[item] || 0);
      totalsByItem[item] += qty;
      grandTotal += qty;
    }
  }
  return { totalsByItem, grandTotal };
}

function OrdersPivotTable({
  itemColumns,
  pagedRows,
  allRows,
  dash,
  pagination,
  customerHeader,
  totalLabel,
}) {
  const { totalsByItem, grandTotal } = computePivotTotals(allRows, itemColumns);
  const showPagination = pagination && pagination.totalRows > pagination.pageSize;

  return (
    <div className="orders-pivot-table-wrap">
      <DataTable
        className="orders-pivot-table-wrap__inner"
        tableClassName="orders-pivot-table"
        pagination={showPagination ? pagination : undefined}
      >
        <thead>
          <tr>
            <th>{customerHeader}</th>
            {itemColumns.map((item) => (
              <th key={item}>{item}</th>
            ))}
            <th>{totalLabel}</th>
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((row) => (
            <tr key={row.customerKey}>
              <td>{row.customerLabel}</td>
              {itemColumns.map((item) => (
                <td key={item} className="orders-pivot-table__qty">
                  {row.qtyByItem[item] != null ? (
                    <span className="qty-chip">{row.qtyByItem[item]}</span>
                  ) : (
                    dash
                  )}
                </td>
              ))}
              <td className="orders-pivot-table__qty">
                <span className="qty-chip">{sumRowQty(row, itemColumns)}</span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="orders-pivot-table__total-row">
            <th scope="row">{totalLabel}</th>
            {itemColumns.map((item) => (
              <td key={item} className="orders-pivot-table__qty">
                <span className="qty-chip qty-chip--total">{totalsByItem[item]}</span>
              </td>
            ))}
            <td className="orders-pivot-table__qty">
              <span className="qty-chip qty-chip--total">{grandTotal}</span>
            </td>
          </tr>
        </tfoot>
      </DataTable>
    </div>
  );
}

/**
 * Clipboard:
 * -{date}: {driver}   ← once per truck
 * -{customer}: {item qty summary}
 */
function formatTruckCopyText(truckRow, dash, locale) {
  // Format date as per locale
  const dateStr = new Date().toLocaleString(locale || undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const driver = truckRow.truckLabel || dash;

  const lines = [`${dateStr}: ${driver}\n`];

  // Group orders by customer address for copy
  const byCustomerAddress = new Map();
  for (const order of truckRow.rows || []) {
    const customerAddr = getCustomerLabelForCopy(order, dash);
    if (!byCustomerAddress.has(customerAddr)) byCustomerAddress.set(customerAddr, []);
    byCustomerAddress.get(customerAddr).push(order);
  }

  // For each customer address, concatenate items in "item1 ចំនួន: qty + item2 ចំនួន: qty" format
  for (const [custAddr, addrOrders] of byCustomerAddress) {
    const itemStrs = addrOrders.map((order) => {
      const itemName = (order.itemName || dash).trim();
      const qty = Number(order.orderedQty || 0);
      return `${itemName} ចំនួន: ${qty}`;
    });
    lines.push(`-${custAddr}: ${itemStrs.join(" + ")}`);
  }

  return lines.join("\n");
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

export function OrdersPage({ orders, deliveryAgents = [] }) {
  const { t, i18n } = useTranslation();
  const [activeTruck, setActiveTruck] = useState(null);
  const [truckSearchText, setTruckSearchText] = useState("");
  const [appliedTruckSearch, setAppliedTruckSearch] = useState("");
  const [copiedTruckKey, setCopiedTruckKey] = useState(null);

  const agentById = useMemo(() => buildAgentLookup(deliveryAgents), [deliveryAgents]);

  const groupedByTruck = useMemo(() => {
    const map = new Map();
    (orders || []).forEach((order) => {
      const id = order.deliveryAgentId != null && String(order.deliveryAgentId).trim() !== ""
        ? String(order.deliveryAgentId)
        : null;
      const key = id ?? "__unassigned__";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(order);
    });
    return Array.from(map.entries()).map(([truckKey, rows]) => {
      const agent = truckKey !== "__unassigned__" ? agentById.get(truckKey) : null;
      const nameFromOrder = rows.find((r) => r.deliveryAgentName)?.deliveryAgentName;
      const truckLabel =
        agent?.name || nameFromOrder || (truckKey === "__unassigned__" ? t("orders.unassignedTruck") : t("orders.dash"));
      const vehicleType = agent?.vehicleType?.trim() || t("orders.dash");
      const statuses = Array.from(new Set(rows.map((row) => row.status).filter(Boolean)));
      const qty = rows.reduce((sum, row) => sum + Number(row.orderedQty || 0), 0);
      return {
        truckKey,
        truckLabel,
        vehicleType,
        rows,
        qty,
        statusLabel: statuses.length === 1 ? statuses[0] : t("orders.mixedStatus", { defaultValue: "MIXED" }),
      };
    });
  }, [orders, agentById, t]);

  const filteredGroupedTrucks = useMemo(() => {
    const keyword = appliedTruckSearch.trim().toLowerCase();
    if (!keyword) return groupedByTruck;
    return groupedByTruck.filter((row) =>
      [row.truckLabel, row.vehicleType, row.qty, row.statusLabel]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [groupedByTruck, appliedTruckSearch]);

  const {
    page: truckPage,
    pageSize: truckPageSize,
    paged: pagedGroupedTrucks,
    setPage: setTruckPage,
    setPageSize: setTruckPageSize,
  } = usePagination(filteredGroupedTrucks, { resetKey: appliedTruckSearch });

  const dash = t("orders.dash");

  const pivotedTruck = useMemo(
    () => pivotOrdersByCustomer(activeTruck?.rows ?? [], dash),
    [activeTruck?.rows, dash],
  );

  const {
    page: modalTruckOrderPage,
    pageSize: modalTruckOrderPageSize,
    paged: pagedModalTruckRows,
    setPage: setModalTruckOrderPage,
    setPageSize: setModalTruckOrderPageSize,
  } = usePagination(pivotedTruck.rows, { resetKey: activeTruck?.truckKey ?? "" });

  function openTruck(truck) {
    setActiveTruck(truck);
  }

  async function handleCopyTruck(row) {
    const dash = t("orders.dash");
    const text = formatTruckCopyText(row, dash, i18n.language);
    try {
      await copyTextToClipboard(text);
      setCopiedTruckKey(row.truckKey);
      window.setTimeout(() => setCopiedTruckKey((k) => (k === row.truckKey ? null : k)), 2000);
    } catch {
      setCopiedTruckKey(null);
    }
  }

  return (
    <section className="admin-page orders-page-panels">
      <div className="section-heading">
        <h2>{t("orders.title")}</h2>
        <p className="section-lead">{t("orders.lead")}</p>
      </div>
      <section className="panel">
        <div className="panel-header">
          <h3>{t("orders.byTruck")}</h3>
          <p className="panel-meta">
            {groupedByTruck.length === 1
              ? t("orders.rowOne", { n: groupedByTruck.length })
              : t("orders.rowMany", { n: groupedByTruck.length })}
          </p>
        </div>
        <DataTable
          showSearch
          searchValue={truckSearchText}
          onSearchValueChange={setTruckSearchText}
          onSearch={() => setAppliedTruckSearch(truckSearchText)}
          searchPlaceholder={t("orders.searchTrucksPlaceholder")}
          searchButtonLabel={t("common.search", { defaultValue: "Search" })}
          pagination={{
            page: truckPage,
            pageSize: truckPageSize,
            totalRows: filteredGroupedTrucks.length,
            onPageChange: setTruckPage,
            onPageSizeChange: setTruckPageSize,
          }}
        >
          <thead>
            <tr>
              <th>{t("orders.driverOrAgent")}</th>
              <th>{t("orders.vehicleType")}</th>
              <th>{t("orders.qty")}</th>
              <th>{t("orders.status")}</th>
              <th>{t("orders.actions", { defaultValue: "Actions" })}</th>
            </tr>
          </thead>
          <tbody>
            {pagedGroupedTrucks.map((row) => (
              <tr key={row.truckKey}>
                <td>{row.truckLabel}</td>
                <td>{row.vehicleType}</td>
                <td>
                  <span className="qty-chip">{row.qty}</span>
                </td>
                <td>
                  <span className="status-chip">{row.statusLabel}</span>
                </td>
                <td>
                  <div className="orders-truck-actions">
                    <Button variant="sm" onClick={() => openTruck(row)}>
                      {t("orders.view", { defaultValue: "View" })}
                    </Button>
                    <Button variant="sm" onClick={() => void handleCopyTruck(row)}>
                      {copiedTruckKey === row.truckKey
                        ? t("orders.copyTruckDone")
                        : t("orders.copyTruck")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>

      {activeTruck ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="orders-truck-view-title">
          <section className="panel modal-card modal-card--orders-truck modal-card--orders-pivot">
            <div className="panel-header">
              <h3 id="orders-truck-view-title">
                {t("orders.truckOrdersFor", {
                  defaultValue: "Orders for {{truck}}",
                  truck: activeTruck.truckLabel,
                })}
              </h3>
              <Button variant="ghost" tone="cancel" onClick={() => setActiveTruck(null)}>
                {t("customers.cancel")}
              </Button>
            </div>
            <OrdersPivotTable
              itemColumns={pivotedTruck.itemColumns}
              pagedRows={pagedModalTruckRows}
              allRows={pivotedTruck.rows}
              dash={dash}
              customerHeader={t("orders.customer")}
              totalLabel={t("orders.totalAll", { defaultValue: "Total" })}
              pagination={{
                page: modalTruckOrderPage,
                pageSize: modalTruckOrderPageSize,
                totalRows: pivotedTruck.rows.length,
                onPageChange: setModalTruckOrderPage,
                onPageSizeChange: setModalTruckOrderPageSize,
              }}
            />
          </section>
        </div>
      ) : null}
    </section>
  );
}
