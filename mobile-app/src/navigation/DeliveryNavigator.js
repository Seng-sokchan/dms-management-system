import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import DeliveryTrackingScreen from "../screens/DeliveryTrackingScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { AppIcon } from "../components/ui";
import { colors, typography } from "../theme";

function TabIconMap({ color, size }) {
  return <AppIcon name="map-marker-radius" color={color} size={size} />;
}

function TabIconProfile({ color, size }) {
  return <AppIcon name="account-outline" color={color} size={size} />;
}

const Tab = createBottomTabNavigator();

export default function DeliveryNavigator() {
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
        name="DeliveryLive"
        component={DeliveryTrackingScreen}
        options={{
          title: "Live",
          tabBarLabel: "Live",
          tabBarIcon: TabIconMap,
        }}
      />
      <Tab.Screen
        name="DeliveryProfile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: TabIconProfile,
        }}
      />
    </Tab.Navigator>
  );
}
