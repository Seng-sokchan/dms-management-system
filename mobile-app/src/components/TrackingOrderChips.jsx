import React, { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

function TrackingOrderChip({ item, isLinked, subtitle, onPress, styles }) {
  const { t } = useTranslation();
  const label = t("tracking.orderLabel", { id: item.id, name: item.itemName || "Order" });

  const content = (
    <>
      <Text style={[styles.orderChipTitle, isLinked && styles.orderChipTitleActive]} numberOfLines={2}>
        {label}
      </Text>
      {subtitle ? (
        <Text style={[styles.orderChipSub, isLinked && styles.orderChipSubActive]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </>
  );

  if (!isLinked) {
    return (
      <View
        style={[styles.orderChip, styles.orderChipLocked]}
        accessibilityRole="text"
        accessibilityLabel={label}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={[styles.orderChip, styles.orderChipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: true }}
      accessibilityLabel={label}
    >
      {content}
    </Pressable>
  );
}

export default function TrackingOrderChips({ orders, linkedOrderId, getSubtitle, onLinkedPress }) {
  const { colors, radii, spacing, typography } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        chipList: { paddingVertical: spacing.xs, paddingRight: spacing.sm },
        orderChip: {
          marginRight: spacing.sm,
          borderRadius: radii.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: colors.surfaceSoft,
          maxWidth: 240,
        },
        orderChipActive: {
          backgroundColor: colors.primary,
        },
        orderChipLocked: {
          opacity: 0.55,
        },
        orderChipTitle: {
          color: colors.textPrimary,
          fontWeight: "600",
          fontSize: typography.bodySmall,
          flexShrink: 1,
        },
        orderChipTitleActive: { color: colors.onPrimary },
        orderChipSub: { color: colors.textMuted, marginTop: 2, fontSize: typography.caption },
        orderChipSubActive: { color: colors.onPrimary, opacity: 0.72 },
      }),
    [colors, radii, spacing, typography],
  );

  const renderItem = ({ item }) => {
    const isLinked = String(item.id) === String(linkedOrderId);
    return (
      <TrackingOrderChip
        item={item}
        isLinked={isLinked}
        subtitle={getSubtitle?.(item)}
        onPress={isLinked ? onLinkedPress : undefined}
        styles={styles}
      />
    );
  };

  return (
    <FlatList
      horizontal
      data={orders}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipList}
      extraData={linkedOrderId}
    />
  );
}
