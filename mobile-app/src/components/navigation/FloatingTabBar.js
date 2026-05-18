import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

const BAR_HEIGHT = 64;

function TabItem({ route, isFocused, options, navigation, descriptors, floatingTabBar, styles }) {
  const { tabBarAccessibilityLabel, tabBarTestID } = descriptors[route.key].options;
  const label =
    options.tabBarLabel !== undefined
      ? options.tabBarLabel
      : options.title !== undefined
        ? options.title
        : route.name;

  const onPress = () => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const onLongPress = () => {
    navigation.emit({
      type: "tabLongPress",
      target: route.key,
    });
  };

  const color = isFocused ? floatingTabBar.active : floatingTabBar.inactive;
  const icon =
    options.tabBarIcon?.({
      focused: isFocused,
      color,
      size: 24,
    }) ?? null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={tabBarAccessibilityLabel ?? String(label)}
      testID={tabBarTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
    >
      {icon}
      <Text
        style={[styles.tabLabel, isFocused ? styles.tabLabelActive : styles.tabLabelInactive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function isTabBarHidden(descriptors, route) {
  const style = descriptors[route.key]?.options?.tabBarStyle;
  if (style?.display === "none") return true;

  const nested = route.state;
  if (!nested?.routes?.length) return false;
  const nestedRoute = nested.routes[nested.index ?? 0];
  return nestedRoute?.name === "DeliveryNavigation";
}

/** Floating pill bottom tab bar */
export default function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { floatingTabBar } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 20,
          alignItems: "center",
        },
        pill: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          width: "100%",
          maxWidth: 400,
          minHeight: BAR_HEIGHT,
          paddingHorizontal: 8,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: floatingTabBar.background,
          ...Platform.select({
            ios: {
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
            },
            android: {
              elevation: 12,
            },
          }),
        },
        tabItem: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          paddingVertical: 4,
          minWidth: 56,
        },
        tabLabel: {
          fontSize: 11,
          letterSpacing: 0.1,
        },
        tabLabelActive: {
          color: floatingTabBar.active,
          fontWeight: "700",
        },
        tabLabelInactive: {
          color: floatingTabBar.inactive,
          fontWeight: "500",
        },
      }),
    [floatingTabBar],
  );

  const focusedRoute = state.routes[state.index];
  if (focusedRoute && isTabBarHidden(descriptors, focusedRoute)) {
    return null;
  }

  return (
    <View
      style={[styles.root, { paddingBottom: Math.max(insets.bottom, 10) }]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        {state.routes.map((route) => {
          const { options } = descriptors[route.key];
          if (options.tabBarButton === null || options.href === null) {
            return null;
          }
          const isFocused = state.index === state.routes.indexOf(route);
          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              options={options}
              navigation={navigation}
              descriptors={descriptors}
              floatingTabBar={floatingTabBar}
              styles={styles}
            />
          );
        })}
      </View>
    </View>
  );
}

/** Reserve space so screen content clears the floating bar */
export const FLOATING_TAB_BAR_OFFSET = BAR_HEIGHT + 28;
