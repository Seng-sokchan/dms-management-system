import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../hooks/usePagination";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import "./OrdersPage.css";

function getGroupAddress(order) {
  return order.orderGroupName || "";
}

function getDeliverySummaryLabel(order) {
  return order.deliveryAgentName || "";
}

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

/**
 * Clipboard:
 * -{date}: {driver} + {all group names, comma-separated}   ← once per truck
 * {addr} (Item, QTY)
 *       (Item2, QTY)  // aligned to first "("
 */
function formatTruckCopyText(truckRow, dash, locale) {
  // Format date as per locale
  const dateStr = new Date().toLocaleString(locale || undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const driver = truckRow.truckLabel || dash;

  // Collect all group addresses (main group destination)
  const groupAddresses = new Set();
  (truckRow.rows || []).forEach((order) => {
    groupAddresses.add(getGroupAddress(order) || dash);
  });

  // Use only the main group address (if present, use first), or dash
  const mainGroupAddress = Array.from(groupAddresses)[0] || dash;

  // First line: -DateNow: Driver + Group main address
  const lines = [`${dateStr}: ${driver} => ${mainGroupAddress}\n`];

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
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeTruck, setActiveTruck] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [truckSearchText, setTruckSearchText] = useState("");
  const [appliedTruckSearch, setAppliedTruckSearch] = useState("");
  const [copiedTruckKey, setCopiedTruckKey] = useState(null);

  const agentById = useMemo(() => buildAgentLookup(deliveryAgents), [deliveryAgents]);

  const groupedOrders = useMemo(() => {
    const map = new Map();
    (orders || []).forEach((order) => {
      const key = getGroupAddress(order) || t("orders.dash");
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(order);
    });
    return Array.from(map.entries()).map(([groupAddress, rows]) => {
      const deliveryNames = Array.from(
        new Set(rows.map(getDeliverySummaryLabel).filter(Boolean)),
      );
      const statuses = Array.from(new Set(rows.map((row) => row.status).filter(Boolean)));
      const qty = rows.reduce((sum, row) => sum + Number(row.orderedQty || 0), 0);
      return {
        groupAddress,
        rows,
        qty,
        deliveryLabel: deliveryNames.length ? deliveryNames.join(", ") : t("orders.dash"),
        statusLabel: statuses.length === 1 ? statuses[0] : t("orders.mixedStatus", { defaultValue: "MIXED" }),
      };
    });
  }, [orders, t]);

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
      const groupNames = Array.from(new Set(rows.map(getGroupAddress).filter(Boolean)));
      const statuses = Array.from(new Set(rows.map((row) => row.status).filter(Boolean)));
      const qty = rows.reduce((sum, row) => sum + Number(row.orderedQty || 0), 0);
      return {
        truckKey,
        truckLabel,
        vehicleType,
        groupSummary: groupNames.length ? groupNames.join(", ") : t("orders.dash"),
        rows,
        qty,
        statusLabel: statuses.length === 1 ? statuses[0] : t("orders.mixedStatus", { defaultValue: "MIXED" }),
      };
    });
  }, [orders, agentById, t]);

  const filteredGroupedOrders = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return groupedOrders;
    return groupedOrders.filter((group) =>
      [group.groupAddress, group.deliveryLabel, group.qty, group.statusLabel]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [groupedOrders, appliedSearch]);

  const filteredGroupedTrucks = useMemo(() => {
    const keyword = appliedTruckSearch.trim().toLowerCase();
    if (!keyword) return groupedByTruck;
    return groupedByTruck.filter((row) =>
      [row.truckLabel, row.vehicleType, row.groupSummary, row.qty, row.statusLabel]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [groupedByTruck, appliedTruckSearch]);

  const {
    page: groupPage,
    pageSize: groupPageSize,
    paged: pagedGroupedOrders,
    setPage: setGroupPage,
    setPageSize: setGroupPageSize,
  } = usePagination(filteredGroupedOrders, { resetKey: appliedSearch });

  const {
    page: truckPage,
    pageSize: truckPageSize,
    paged: pagedGroupedTrucks,
    setPage: setTruckPage,
    setPageSize: setTruckPageSize,
  } = usePagination(filteredGroupedTrucks, { resetKey: appliedTruckSearch });

  const orderModalRows = activeGroup?.rows ?? [];
  const truckModalRows = activeTruck?.rows ?? [];

  const {
    page: modalOrderPage,
    pageSize: modalOrderPageSize,
    paged: pagedModalOrders,
    setPage: setModalOrderPage,
    setPageSize: setModalOrderPageSize,
  } = usePagination(orderModalRows, { resetKey: activeGroup?.groupAddress ?? "" });

  const {
    page: modalTruckOrderPage,
    pageSize: modalTruckOrderPageSize,
    paged: pagedModalTruckOrders,
    setPage: setModalTruckOrderPage,
    setPageSize: setModalTruckOrderPageSize,
  } = usePagination(truckModalRows, { resetKey: activeTruck?.truckKey ?? "" });

  function openGroup(group) {
    setActiveTruck(null);
    setActiveGroup(group);
  }

  function openTruck(truck) {
    setActiveGroup(null);
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
          <h3>{t("orders.byOrderGroup")}</h3>
          <p className="panel-meta">
            {groupedOrders.length === 1
              ? t("orders.rowOne", { n: groupedOrders.length })
              : t("orders.rowMany", { n: groupedOrders.length })}
          </p>
        </div>
        <DataTable
          showSearch
          searchValue={searchText}
          onSearchValueChange={setSearchText}
          onSearch={() => setAppliedSearch(searchText)}
          searchPlaceholder={t("orders.searchPlaceholder", { defaultValue: "Search grouped orders..." })}
          searchButtonLabel={t("common.search", { defaultValue: "Search" })}
          pagination={{
            page: groupPage,
            pageSize: groupPageSize,
            totalRows: filteredGroupedOrders.length,
            onPageChange: setGroupPage,
            onPageSizeChange: setGroupPageSize,
          }}
        >
          <thead>
            <tr>
              <th>{t("orders.groupMainAddress", { defaultValue: "Group main address" })}</th>
              <th>{t("orders.delivery")}</th>
              <th>{t("orders.qty")}</th>
              <th>{t("orders.status")}</th>
              <th>{t("orders.actions", { defaultValue: "Actions" })}</th>
            </tr>
          </thead>
          <tbody>
            {pagedGroupedOrders.map((group) => (
              <tr key={group.groupAddress}>
                <td>{group.groupAddress}</td>
                <td>{group.deliveryLabel}</td>
                <td>
                  <span className="qty-chip">{group.qty}</span>
                </td>
                <td>
                  <span className="status-chip">{group.statusLabel}</span>
                </td>
                <td>
                  <Button variant="sm" onClick={() => openGroup(group)}>
                    {t("orders.view", { defaultValue: "View" })}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>

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
              <th>{t("orders.groupMainAddress", { defaultValue: "Group main address" })}</th>
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
                <td>{row.groupSummary}</td>
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

      {activeGroup ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="orders-group-view-title">
          <section className="panel modal-card modal-card--orders-group">
            <div className="panel-header">
              <h3 id="orders-group-view-title">
                {t("orders.groupOrdersFor", {
                  defaultValue: "Orders for {{group}}",
                  group: activeGroup.groupAddress,
                })}
              </h3>
              <Button variant="ghost" tone="cancel" onClick={() => setActiveGroup(null)}>
                {t("customers.cancel")}
              </Button>
            </div>
            <DataTable
              pagination={{
                page: modalOrderPage,
                pageSize: modalOrderPageSize,
                totalRows: orderModalRows.length,
                onPageChange: setModalOrderPage,
                onPageSizeChange: setModalOrderPageSize,
              }}
            >
              <thead>
                <tr>
                  <th>{t("orders.customer")}</th>
                  <th>{t("orders.item")}</th>
                  <th>{t("orders.delivery")}</th>
                  <th>{t("orders.qty")}</th>
                  <th>{t("orders.status")}</th>
                </tr>
              </thead>
              <tbody>
                {pagedModalOrders.map((row) => (
                  <tr key={row.id}>
                    <td>{row.customerDirectoryName || t("orders.dash")}</td>
                    <td>
                      {row.itemName
                        ? `#${row.id} - ${row.itemName}`
                        : `#${row.id} - ${t("orders.dash")}`}
                    </td>
                    <td>{getDeliverySummaryLabel(row) || t("orders.dash")}</td>
                    <td>{row.orderedQty}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </section>
        </div>
      ) : null}

      {activeTruck ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="orders-truck-view-title">
          <section className="panel modal-card modal-card--orders-group">
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
            <DataTable
              pagination={{
                page: modalTruckOrderPage,
                pageSize: modalTruckOrderPageSize,
                totalRows: truckModalRows.length,
                onPageChange: setModalTruckOrderPage,
                onPageSizeChange: setModalTruckOrderPageSize,
              }}
            >
              <thead>
                <tr>
                  <th>{t("orders.address")}</th>
                  <th>{t("orders.item")}</th>
                  <th>{t("orders.groupMainAddress", { defaultValue: "Group main address" })}</th>
                  <th>{t("orders.qty")}</th>
                  <th>{t("orders.status")}</th>
                </tr>
              </thead>
              <tbody>
                {pagedModalTruckOrders.map((row) => (
                  <tr key={row.id}>
                    <td>{row.customerName || t("orders.dash")}</td>
                    <td>
                      {row.itemName
                        ? `#${row.id} - ${row.itemName}`
                        : `#${row.id} - ${t("orders.dash")}`}
                    </td>
                    <td>{getGroupAddress(row) || t("orders.dash")}</td>
                    <td>{row.orderedQty}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </section>
        </div>
      ) : null}
    </section>
  );
}
