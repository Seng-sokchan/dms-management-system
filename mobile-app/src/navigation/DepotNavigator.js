import React from "react";
import { useTranslation } from "react-i18next";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PrepareDepotBatchScreen from "../screens/PrepareDepotBatchScreen";
import DepotOrdersScreen from "../screens/DepotOrdersScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { AppIcon } from "../components/ui";
import FloatingTabBar from "../components/navigation/FloatingTabBar";
import { useFloatingTabScreenOptions, useStackScreenOptions } from "./screenOptions";

function TabIconPrepare({ color, size }) {
  return <AppIcon name="clipboard-list-outline" color={color} size={size} />;
}

function TabIconOrders({ color, size }) {
  return <AppIcon name="package-variant-closed" color={color} size={size} />;
}

function TabIconProfile({ color, size }) {
  return <AppIcon name="account-outline" color={color} size={size} />;
}

const Tab = createBottomTabNavigator();
const PrepareStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
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
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={floatingTabScreenOptions}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tab.Screen
        name="DepotPrepare"
        component={PrepareNavigator}
        options={{ title: t("nav.prepare"), tabBarLabel: t("nav.prepare"), tabBarIcon: TabIconPrepare }}
      />
      <Tab.Screen
        name="DepotOrdersTab"
        component={OrdersNavigator}
        options={{ title: t("nav.orders"), tabBarLabel: t("nav.orders"), tabBarIcon: TabIconOrders }}
      />
      <Tab.Screen
        name="DepotProfileTab"
        component={ProfileNavigator}
        options={{ title: t("nav.profile"), tabBarLabel: t("nav.profile"), tabBarIcon: TabIconProfile }}
      />
    </Tab.Navigator>
  );
}
