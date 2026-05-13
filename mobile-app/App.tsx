// @ts-nocheck
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import LoginScreen from "./src/screens/LoginScreen";
import AuthenticatedTabs from "./src/navigation/AuthenticatedTabs";
import DeliveryNavigator from "./src/navigation/DeliveryNavigator";
import DepotNavigator from "./src/navigation/DepotNavigator";
import { colors, typography } from "./src/theme";

const Stack = createNativeStackNavigator();

function CustomerMain() {
  return (
    <CartProvider>
      <AuthenticatedTabs />
    </CartProvider>
  );
}

function AppNavigator() {
  const { isLoading, token, user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loaderText}>Preparing your workspace...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.primary,
        },
        fonts: {
          regular: { fontFamily: "System", fontWeight: "400" },
          medium: { fontFamily: "System", fontWeight: "500" },
          bold: { fontFamily: "System", fontWeight: "700" },
          heavy: { fontFamily: "System", fontWeight: "800" },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: styles.header,
          headerShadowVisible: true,
          headerTitleStyle: styles.headerTitle,
          headerTitleAlign: "left",
          headerTintColor: colors.textPrimary,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        {!token ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : user?.role === "Delivery" ? (
          <Stack.Screen
            name="DeliveryMain"
            component={DeliveryNavigator}
            options={{ headerShown: false }}
          />
        ) : user?.role === "Depot" ? (
          <Stack.Screen
            name="DepotMain"
            component={DepotNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="Main"
            component={CustomerMain}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 12,
  },
  loaderText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
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
