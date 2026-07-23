import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppIcon from "../ui/AppIcon";
import { useTheme } from "../../context/ThemeContext";

const ADMIN_ICON = "#C62828";
const ADMIN_LABEL = "#1A237E";
const TILE_BG = "#FBF9F6";
const TILE_PRESSED = "#EDE4F5";
const TILE_BORDER = "#B8B2A8";

export default function AdminMenuTile({
  icon,
  label,
  badgeCount,
  onPress,
  accessibilityLabel,
}) {
  const { spacing, radii, typography } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        pressable: {
          flex: 1,
          aspectRatio: 1,
          margin: spacing.xs,
        },
        tile: {
          flex: 1,
          backgroundColor: TILE_BG,
          borderRadius: radii.md,
          borderWidth: 1.5,
          borderColor: TILE_BORDER,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.md,
        },
        tilePressed: {
          backgroundColor: TILE_PRESSED,
          borderColor: "#9E96C8",
        },
        iconWrap: {
          position: "relative",
          marginBottom: spacing.sm,
        },
        label: {
          fontSize: typography.bodySmall,
          fontWeight: "600",
          color: ADMIN_LABEL,
          textAlign: "center",
          lineHeight: 18,
        },
        badge: {
          position: "absolute",
          top: -6,
          right: -10,
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: ADMIN_ICON,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 4,
        },
        badgeText: {
          color: "#FFFFFF",
          fontSize: 10,
          fontWeight: "700",
        },
      }),
    [radii.md, spacing, typography.bodySmall],
  );

  return (
    <Pressable
      style={styles.pressable}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
    >
      {({ pressed }) => (
        <View style={[styles.tile, pressed && styles.tilePressed]}>
          <View style={styles.iconWrap}>
            <AppIcon name={icon} size={40} color={ADMIN_ICON} />
            {badgeCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badgeCount > 99 ? "99+" : String(badgeCount)}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
