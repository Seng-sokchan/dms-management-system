import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { OrdersTable } from "../../features/order/OrdersTable";
import { filterOrdersByDay, formatDayLabel } from "./ordersTodayUtils";
import "../OrdersPage.css";

export function OrdersAllPage({ orders, statuses = [], onUpdateLoss }) {
  const { t } = useTranslation();
  const [dayFilter, setDayFilter] = useState("yesterday");

  const dayLabel = useMemo(() => formatDayLabel(dayFilter), [dayFilter]);
  const filteredOrders = useMemo(
    () => filterOrdersByDay(orders, dayFilter),
    [orders, dayFilter],
  );

  return (
    <section className="admin-page orders-page-panels">
      <div className="section-heading">
        <h2>{t("orders.allOrders")}</h2>
        <p className="section-lead">{t("orders.lead")}</p>
        <p className="form-hint">
          {dayFilter === "yesterday"
            ? t("orders.yesterdayOnlyHint", { date: dayLabel })
            : t("orders.todayOnlyHint", { date: dayLabel })}
        </p>
        <p className="form-hint">
          {t("orders.lossEditHint", {
            defaultValue: "You can update loss quantity only. Status and distributed qty stay unchanged.",
          })}
        </p>
      </div>
      <OrdersTable
        orders={filteredOrders}
        statuses={statuses}
        readOnly
        lossEditable
        onUpdateLoss={onUpdateLoss}
        filterKey={dayFilter}
        searchExtra={
          <select
            value={dayFilter}
            onChange={(event) => setDayFilter(event.target.value)}
            aria-label={t("orders.filterByDay", { defaultValue: "Filter by day" })}
          >
            <option value="yesterday">{t("orders.yesterday", { defaultValue: "Yesterday" })}</option>
            <option value="today">{t("orders.today", { defaultValue: "Today" })}</option>
          </select>
        }
      />
    </section>
  );
}
