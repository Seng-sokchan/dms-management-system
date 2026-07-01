import React from "react";
import { useTranslation } from "react-i18next";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeliveryCartProvider } from "../context/DeliveryCartContext";
import { useAuth } from "../context/AuthContext";
import { useMobileNavigation } from "../hooks/useMobileNavigation";
import { useTheme } from "../context/ThemeContext";
import DeliveryTrackingScreen from "../screens/DeliveryTrackingScreen";
import DeliveryNavigationScreen from "../screens/DeliveryNavigationScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { AppIcon } from "../components/ui";
import FloatingTabBar from "../components/navigation/FloatingTabBar";
import { useFloatingTabScreenOptions, useStackScreenOptions } from "./screenOptions";

function TabIconMap({ color, size }) {
  return <AppIcon name="map-marker-radius" color={color} size={size} />;
}

function TabIconProfile({ color, size }) {
  return <AppIcon name="account-outline" color={color} size={size} />;
}

const Tab = createBottomTabNavigator();
const LiveStack = createNativeStackNavigator();

function deliveryLiveTabOptions({ route }, floatingTabScreenOptions, colors) {
  const nestedRoute = getFocusedRouteNameFromRoute(route);
  const hideTabBar = nestedRoute === "DeliveryNavigation";

  if (hideTabBar) {
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

function DeliveryLiveStack() {
  const stackScreenOptions = useStackScreenOptions();
  const { colors } = useTheme();

  return (
    <LiveStack.Navigator
      screenOptions={{
        ...stackScreenOptions,
        contentStyle: { flex: 1, backgroundColor: colors.background },
      }}
    >
      <LiveStack.Screen
        name="DeliveryHome"
        component={DeliveryTrackingScreen}
        options={{ headerShown: false }}
      />
      <LiveStack.Screen
        name="DeliveryNavigation"
        component={DeliveryNavigationScreen}
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
    </LiveStack.Navigator>
  );
}

export default function DeliveryNavigator() {
  const floatingTabScreenOptions = useFloatingTabScreenOptions();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasMenu } = useMobileNavigation(user);

  return (
    <DeliveryCartProvider>
    <Tab.Navigator
      screenOptions={floatingTabScreenOptions}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      {hasMenu("mobile.live") ? (
      <Tab.Screen
        name="DeliveryLive"
        component={DeliveryLiveStack}
        options={({ route }) => ({
          title: t("nav.live"),
          tabBarLabel: t("nav.live"),
          tabBarIcon: TabIconMap,
          ...deliveryLiveTabOptions({ route }, floatingTabScreenOptions, colors),
        })}
      />
      ) : null}
      {hasMenu("mobile.profile") ? (
      <Tab.Screen
        name="DeliveryProfile"
        component={ProfileScreen}
        options={{ title: t("nav.profile"), tabBarLabel: t("nav.profile"), tabBarIcon: TabIconProfile }}
      />
      ) : null}
    </Tab.Navigator>
    </DeliveryCartProvider>
  );
}
