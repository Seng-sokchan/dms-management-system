import React from "react";
import { useTranslation } from "react-i18next";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PrepareDepotBatchScreen from "../screens/PrepareDepotBatchScreen";
import DepotBatchCartScreen from "../screens/DepotBatchCartScreen";
import DepotOrdersScreen from "../screens/DepotOrdersScreen";
import DepotTrackingScreen from "../screens/DepotTrackingScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { useAuth } from "../context/AuthContext";
import { useMobileNavigation } from "../hooks/useMobileNavigation";
import { AppIcon } from "../components/ui";
import FloatingTabBar from "../components/navigation/FloatingTabBar";
import { useTheme } from "../context/ThemeContext";
import { useFloatingTabScreenOptions, useStackScreenOptions } from "./screenOptions";

function depotPrepareTabOptions({ route }, floatingTabScreenOptions, colors) {
  const nestedRoute = getFocusedRouteNameFromRoute(route);
  const onBatchCart = nestedRoute === "DepotBatchCart";

  if (onBatchCart) {
    return {
      tabBarStyle: { display: "none" },
      sceneContainerStyle: {
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: 0,
      },
    };
  }

  return {
    tabBarStyle: floatingTabScreenOptions.tabBarStyle,
    sceneContainerStyle: floatingTabScreenOptions.sceneContainerStyle,
  };
}

function TabIconPrepare({ color, size }) {
  return <AppIcon name="clipboard-list-outline" color={color} size={size} />;
}

function TabIconOrders({ color, size }) {
  return <AppIcon name="package-variant-closed" color={color} size={size} />;
}

function TabIconTracking({ color, size }) {
  return <AppIcon name="map-marker-radius" color={color} size={size} />;
}

function TabIconProfile({ color, size }) {
  return <AppIcon name="account-outline" color={color} size={size} />;
}

const Tab = createBottomTabNavigator();
const PrepareStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const TrackingStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function PrepareNavigator() {
  const stackScreenOptions = useStackScreenOptions();

  return (
    <PrepareStack.Navigator screenOptions={stackScreenOptions}>
      <PrepareStack.Screen
        name="PrepareDepotBatch"
        component={PrepareDepotBatchScreen}
        options={{ headerShown: false }}
      />
      <PrepareStack.Screen
        name="DepotBatchCart"
        component={DepotBatchCartScreen}
        options={{ headerShown: false }}
      />
    </PrepareStack.Navigator>
  );
}

function OrdersNavigator() {
  const stackScreenOptions = useStackScreenOptions();

  return (
    <OrdersStack.Navigator screenOptions={stackScreenOptions}>
      <OrdersStack.Screen
        name="DepotOrders"
        component={DepotOrdersScreen}
        options={{ headerShown: false }}
      />
    </OrdersStack.Navigator>
  );
}

function TrackingNavigator() {
  const stackScreenOptions = useStackScreenOptions();

  return (
    <TrackingStack.Navigator screenOptions={stackScreenOptions}>
      <TrackingStack.Screen
        name="DepotTracking"
        component={DepotTrackingScreen}
        options={{ headerShown: false }}
      />
    </TrackingStack.Navigator>
  );
}

function ProfileNavigator() {
  const stackScreenOptions = useStackScreenOptions();

  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
}

export default function DepotNavigator() {
  const floatingTabScreenOptions = useFloatingTabScreenOptions();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasMenu } = useMobileNavigation(user);

  return (
    <Tab.Navigator
      screenOptions={floatingTabScreenOptions}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      {hasMenu("mobile.prepareBatch") ? (
      <Tab.Screen
        name="DepotPrepare"
        component={PrepareNavigator}
        options={({ route }) => ({
          title: t("nav.prepare"),
          tabBarLabel: t("nav.prepare"),
          tabBarIcon: TabIconPrepare,
          ...depotPrepareTabOptions({ route }, floatingTabScreenOptions, colors),
        })}
      />
      ) : null}
      {hasMenu("mobile.depotOrders") ? (
      <Tab.Screen
        name="DepotOrdersTab"
        component={OrdersNavigator}
        options={{ title: t("nav.orders"), tabBarLabel: t("nav.orders"), tabBarIcon: TabIconOrders }}
      />
      ) : null}
      {hasMenu("mobile.tracking") ? (
      <Tab.Screen
        name="DepotTrackingTab"
        component={TrackingNavigator}
        options={{ title: t("nav.tracking"), tabBarLabel: t("nav.tracking"), tabBarIcon: TabIconTracking }}
      />
      ) : null}
      {hasMenu("mobile.profile") ? (
      <Tab.Screen
        name="DepotProfileTab"
        component={ProfileNavigator}
        options={{ title: t("nav.profile"), tabBarLabel: t("nav.profile"), tabBarIcon: TabIconProfile }}
      />
      ) : null}
    </Tab.Navigator>
  );
}
