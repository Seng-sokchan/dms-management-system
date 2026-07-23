import React, { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AdminMenuTile from "../../components/admin/AdminMenuTile";
import { AppIcon, Screen } from "../../components/ui";
import { getAdminMenuTilesForUser } from "../../constants/adminMenus";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function AdminMenuGridScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors, spacing, typography, radii } = useTheme();

  const tiles = useMemo(() => getAdminMenuTilesForUser(user), [user]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: spacing.md,
          paddingBottom: spacing.lg,
        },
        brandBlock: {
          flex: 1,
          paddingRight: spacing.md,
        },
        brand: {
          fontSize: typography.h2,
          fontWeight: "800",
          color: colors.textPrimary,
        },
        subtitle: {
          marginTop: spacing.xs,
          fontSize: typography.bodySmall,
          color: colors.textSecondary,
        },
        profileBtn: {
          width: 44,
          height: 44,
          borderRadius: radii.pill,
          backgroundColor: colors.surfaceSoft,
          alignItems: "center",
          justifyContent: "center",
        },
        list: {
          paddingBottom: spacing.xxl,
        },
        row: {
          flexDirection: "row",
        },
      }),
    [colors, radii.pill, spacing, typography],
  );

  const onPressTile = (tile) => {
    const title = t(`admin.nav.${tile.key}`, { defaultValue: tile.key });
    navigation.navigate(tile.route, { menuKey: tile.key, title });
  };

  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.brandBlock}>
          <Text style={styles.brand}>{t("admin.home.brand")}</Text>
          <Text style={styles.subtitle}>{t("admin.home.subtitle")}</Text>
        </View>
        <Pressable
          style={styles.profileBtn}
          onPress={() => navigation.navigate("AdminProfile")}
          accessibilityRole="button"
          accessibilityLabel={t("nav.profile")}
        >
          <AppIcon name="account-circle-outline" size={26} color={colors.textPrimary} />
        </Pressable>
      </View>

      <FlatList
        data={tiles}
        keyExtractor={(item) => item.key}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <AdminMenuTile
            icon={item.icon}
            label={t(`admin.nav.${item.key}`, { defaultValue: item.key })}
            onPress={() => onPressTile(item)}
          />
        )}
      />
    </Screen>
  );
}
