import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet } from "react-native";
import ItemListScreen from "../screens/ItemListScreen";
import CartScreen from "../screens/CartScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CustomerTrackingScreen from "../screens/CustomerTrackingScreen";
import { AppIcon } from "../components/ui";
import { colors, typography } from "../theme";

function TabIconNewOrder({ color, size }) {
  return <AppIcon name="cart-outline" color={color} size={size} />;
}

function TabIconProfile({ color, size }) {
  return <AppIcon name="account-outline" color={color} size={size} />;
}

function TabIconTracking({ color, size }) {
  return <AppIcon name="map-marker-radius" color={color} size={size} />;
}

const Tab = createBottomTabNavigator();
const NewOrderStack = createNativeStackNavigator();
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

function NewOrderNavigator() {
  return (
    <NewOrderStack.Navigator screenOptions={stackScreenOptions}>
      <NewOrderStack.Screen name="ItemListScreen" component={ItemListScreen} options={{ title: "Products" }} />
      <NewOrderStack.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: "Your Cart",
          presentation: "card",
        }}
      />
    </NewOrderStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: "Profile" }} />
    </ProfileStack.Navigator>
  );
}

export default function AuthenticatedTabs() {
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
        name="NewOrder"
        component={NewOrderNavigator}
        options={{
          title: "New Order",
          tabBarIcon: TabIconNewOrder,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          title: "Profile",
          tabBarIcon: TabIconProfile,
        }}
      />
      <Tab.Screen
        name="CustomerTracking"
        component={CustomerTrackingScreen}
        options={{
          title: "Tracking",
          tabBarIcon: TabIconTracking,
        }}
      />
    </Tab.Navigator>
  );
}
