import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { OrdersTable } from "../../features/order/OrdersTable";
import { filterOrdersCreatedToday, formatTodayLabel } from "./ordersTodayUtils";
import "../OrdersPage.css";

export function OrdersAllPage({ orders, statuses = [], onUpdateLoss }) {
  const { t } = useTranslation();

  const todayLabel = useMemo(() => formatTodayLabel(), []);
  const todayOrders = useMemo(() => filterOrdersCreatedToday(orders), [orders]);

  return (
    <section className="admin-page orders-page-panels">
      <div className="section-heading">
        <h2>{t("orders.allOrders")}</h2>
        <p className="section-lead">{t("orders.lead")}</p>
        <p className="form-hint">{t("orders.todayOnlyHint", { date: todayLabel })}</p>
        <p className="form-hint">
          {t("orders.lossEditHint", {
            defaultValue: "You can update loss quantity only. Status and distributed qty stay unchanged.",
          })}
        </p>
      </div>
      <OrdersTable
        orders={todayOrders}
        statuses={statuses}
        readOnly
        lossEditable
        onUpdateLoss={onUpdateLoss}
      />
    </section>
  );
}
