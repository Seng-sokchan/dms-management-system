import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { Card, PrimaryButton } from "./ui";
import {
  computePivotTotals,
  pivotOrdersByCustomer,
  sumPivotRowQty,
} from "../utils/pivotOrdersByCustomer";
import { radii, spacing, typography } from "../theme/tokens";

const COL_CUSTOMER = 120;
const COL_ITEM = 64;
const COL_TOTAL = 56;
const COL_ACTION = 72;

function DeliveryCartCardInner({
  orders,
  totalPendingCount,
  canStartDelivery,
  submitting,
  onStartDelivery,
  onRemoveFromCart,
  showStartButton = true,
}) {
  const { t } = useTranslation();
  const { colors, borders } = useTheme();
  const styles = useMemo(() => createCartStyles({ colors, borders }), [borders, colors]);
  const cartCount = orders.length;
  const { itemColumns, rows } = useMemo(() => pivotOrdersByCustomer(orders), [orders]);
  const { totalsByItem, grandTotal } = useMemo(
    () => computePivotTotals(rows, itemColumns),
    [rows, itemColumns],
  );

  const tableMinWidth =
    COL_CUSTOMER + itemColumns.length * COL_ITEM + COL_TOTAL + COL_ACTION;

  function removeCustomerOrders(orderIds) {
    for (const orderId of orderIds) {
      onRemoveFromCart(orderId);
    }
  }

  return (
    <Card style={styles.cartCard}>
      <Text style={styles.cartTitle}>{t("delivery.cartTitle")}</Text>
      <Text style={styles.cartSubtitle}>
        {canStartDelivery
          ? t(cartCount === 1 ? "delivery.cartReady" : "delivery.cartReady_plural", {
              count: cartCount,
            })
          : t("delivery.cartPartial", { count: cartCount, total: totalPendingCount })}
      </Text>

      {rows.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={styles.tableScroll}
          contentContainerStyle={{ minWidth: tableMinWidth }}
        >
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.cell, styles.cellCustomer, styles.headerCell]}>
                {t("delivery.cartCustomer")}
              </Text>
              {itemColumns.map((item) => (
                <Text key={item} style={[styles.cell, styles.cellItem, styles.headerCell]}>
                  {item}
                </Text>
              ))}
              <Text style={[styles.cell, styles.cellTotal, styles.headerCell]}>
                {t("delivery.cartTotal")}
              </Text>
              <Text style={[styles.cell, styles.cellAction, styles.headerCell]} />
            </View>

            {rows.map((row) => (
              <View key={row.customerKey} style={styles.tableRow}>
                <Text
                  style={[styles.cell, styles.cellCustomer, styles.bodyCell]}
                  numberOfLines={2}
                >
                  {row.customerLabel}
                </Text>
                {itemColumns.map((item) => (
                  <Text
                    key={item}
                    style={[styles.cell, styles.cellItem, styles.qtyCell]}
                  >
                    {row.qtyByItem[item] != null ? row.qtyByItem[item] : "—"}
                  </Text>
                ))}
                <Text style={[styles.cell, styles.cellTotal, styles.qtyCell]}>
                  {sumPivotRowQty(row, itemColumns)}
                </Text>
                <View style={[styles.cell, styles.cellAction]}>
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() => removeCustomerOrders(row.orderIds)}
                    disabled={submitting}
                  >
                    <Text style={styles.removeBtnText}>{t("delivery.remove")}</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <View style={[styles.tableRow, styles.tableFooterRow]}>
              <Text style={[styles.cell, styles.cellCustomer, styles.footerCell]}>
                {t("delivery.cartTotal")}
              </Text>
              {itemColumns.map((item) => (
                <Text key={item} style={[styles.cell, styles.cellItem, styles.footerQty]}>
                  {totalsByItem[item] || 0}
                </Text>
              ))}
              <Text style={[styles.cell, styles.cellTotal, styles.footerQty]}>{grandTotal}</Text>
              <View style={[styles.cell, styles.cellAction]} />
            </View>
          </View>
        </ScrollView>
      ) : null}

      {showStartButton ? (
        <PrimaryButton
          title={t("delivery.startDelivery")}
          onPress={onStartDelivery}
          loading={submitting}
          disabled={!canStartDelivery || submitting}
          style={styles.startButton}
        />
      ) : null}
    </Card>
  );
}

export const DeliveryCartCard = React.memo(DeliveryCartCardInner);

function createCartStyles({ colors, borders }) {
  return StyleSheet.create({
  cartCard: {
    marginBottom: spacing.md,
  },
  cartTitle: {
    fontSize: typography.h3,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cartSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tableScroll: {
    marginTop: spacing.md,
    borderRadius: radii.md,
    overflow: "hidden",
    ...borders.panel,
  },
  table: {
    backgroundColor: colors.surface,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    ...borders.dividerBottom,
  },
  tableHeaderRow: {
    backgroundColor: colors.surfaceSoft,
  },
  tableFooterRow: {
    borderBottomWidth: 0,
    backgroundColor: colors.surfaceSoft,
  },
  cell: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  cellCustomer: {
    width: COL_CUSTOMER,
  },
  cellItem: {
    width: COL_ITEM,
    textAlign: "center",
  },
  cellTotal: {
    width: COL_TOTAL,
    textAlign: "center",
  },
  cellAction: {
    width: COL_ACTION,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCell: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  bodyCell: {
    fontSize: typography.bodySmall,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  qtyCell: {
    fontSize: typography.bodySmall,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  footerCell: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  footerQty: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  removeBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  removeBtnText: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: colors.danger,
  },
  startButton: {
    marginTop: spacing.md,
  },
  });
}
