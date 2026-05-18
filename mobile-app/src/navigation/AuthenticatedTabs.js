import React from "react";
import { useTranslation } from "react-i18next";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ItemListScreen from "../screens/ItemListScreen";
import CartScreen from "../screens/CartScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CustomerTrackingScreen from "../screens/CustomerTrackingScreen";
import { AppIcon } from "../components/ui";
import FloatingTabBar from "../components/navigation/FloatingTabBar";
import { useFloatingTabScreenOptions, useStackScreenOptions } from "./screenOptions";

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

function NewOrderNavigator() {
  const stackScreenOptions = useStackScreenOptions();
  const { t } = useTranslation();

  return (
    <NewOrderStack.Navigator screenOptions={stackScreenOptions}>
      <NewOrderStack.Screen
        name="ItemListScreen"
        component={ItemListScreen}
        options={{ headerShown: false }}
      />
      <NewOrderStack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: t("nav.cart"), presentation: "card" }}
      />
    </NewOrderStack.Navigator>
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

export default function AuthenticatedTabs() {
  const floatingTabScreenOptions = useFloatingTabScreenOptions();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={floatingTabScreenOptions}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tab.Screen
        name="NewOrder"
        component={NewOrderNavigator}
        options={{ title: t("nav.order"), tabBarIcon: TabIconNewOrder }}
      />
      <Tab.Screen
        name="CustomerTracking"
        component={CustomerTrackingScreen}
        options={{ title: t("nav.tracking"), tabBarIcon: TabIconTracking }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{ title: t("nav.profile"), tabBarIcon: TabIconProfile }}
      />
    </Tab.Navigator>
  );
}
