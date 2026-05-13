import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet } from "react-native";
import PrepareDepotBatchScreen from "../screens/PrepareDepotBatchScreen";
import DepotOrdersScreen from "../screens/DepotOrdersScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { AppIcon } from "../components/ui";
import { colors, typography } from "../theme";

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

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.h3,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});

const stackScreenOptions = {
  headerStyle: styles.header,
  headerShadowVisible: true,
  headerTitleStyle: styles.headerTitle,
  headerTitleAlign: "left",
  headerTintColor: colors.textPrimary,
  contentStyle: { backgroundColor: colors.background },
  animation: "slide_from_right",
};

function PrepareNavigator() {
  return (
    <PrepareStack.Navigator screenOptions={stackScreenOptions}>
      <PrepareStack.Screen
        name="PrepareDepotBatch"
        component={PrepareDepotBatchScreen}
        options={{ title: "Prepare Batch" }}
      />
    </PrepareStack.Navigator>
  );
}

function OrdersNavigator() {
  return (
    <OrdersStack.Navigator screenOptions={stackScreenOptions}>
      <OrdersStack.Screen
        name="DepotOrders"
        component={DepotOrdersScreen}
        options={{ title: "Depot Orders" }}
      />
    </OrdersStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </ProfileStack.Navigator>
  );
}

export default function DepotNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: typography.caption,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="DepotPrepare"
        component={PrepareNavigator}
        options={{
          title: "Prepare",
          tabBarLabel: "Prepare",
          tabBarIcon: TabIconPrepare,
        }}
      />
      <Tab.Screen
        name="DepotOrdersTab"
        component={OrdersNavigator}
        options={{
          title: "Orders",
          tabBarLabel: "Orders",
          tabBarIcon: TabIconOrders,
        }}
      />
      <Tab.Screen
        name="DepotProfileTab"
        component={ProfileNavigator}
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: TabIconProfile,
        }}
      />
    </Tab.Navigator>
  );
}
