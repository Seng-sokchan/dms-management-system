import React from "react";
import { useTranslation } from "react-i18next";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ItemListScreen from "../screens/ItemListScreen";
import CartScreen from "../screens/CartScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CustomerTrackingScreen from "../screens/CustomerTrackingScreen";
import MyOrdersScreen from "../screens/MyOrdersScreen";
import { AppIcon } from "../components/ui";
import FloatingTabBar from "../components/navigation/FloatingTabBar";
import { useTheme } from "../context/ThemeContext";
import { useFloatingTabScreenOptions, useStackScreenOptions } from "./screenOptions";

function newOrderTabOptions({ route }, floatingTabScreenOptions, colors) {
  const nestedRoute = getFocusedRouteNameFromRoute(route);
  const onCart = nestedRoute === "Cart";

  if (onCart) {
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

function TabIconNewOrder({ color, size }) {
  return <AppIcon name="store-outline" color={color} size={size} />;
}

function TabIconProfile({ color, size }) {
  return <AppIcon name="account-outline" color={color} size={size} />;
}

function TabIconTracking({ color, size }) {
  return <AppIcon name="map-marker-radius" color={color} size={size} />;
}

function TabIconOrders({ color, size }) {
  return <AppIcon name="receipt" color={color} size={size} />;
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
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={floatingTabScreenOptions}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tab.Screen
        name="NewOrder"
        component={NewOrderNavigator}
        options={({ route }) => ({
          title: t("nav.order"),
          tabBarIcon: TabIconNewOrder,
          ...newOrderTabOptions({ route }, floatingTabScreenOptions, colors),
        })}
      />
      <Tab.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{ title: t("nav.orders"), tabBarIcon: TabIconOrders }}
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
