// @ts-nocheck
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { I18nextProvider, useTranslation } from "react-i18next";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { CartProvider } from "./src/context/CartContext";
import LoginScreen from "./src/screens/LoginScreen";
import CustomerRootNavigator from "./src/navigation/CustomerRootNavigator";
import DeliveryNavigator from "./src/navigation/DeliveryNavigator";
import DepotRootNavigator from "./src/navigation/DepotRootNavigator";
import { useStackScreenOptions } from "./src/navigation/screenOptions";
import { bootstrapI18n } from "./src/i18n/config";
import i18n from "./src/i18n/config";
import { navigationRef } from "./src/navigation/paymentReturnNavigation";
import { usePaymentDeepLink } from "./src/hooks/usePaymentDeepLink";

const Stack = createNativeStackNavigator();

function CustomerMain() {
  return (
    <CartProvider>
      <CustomerRootNavigator />
    </CartProvider>
  );
}

function AppNavigator() {
  const { isLoading, token, user } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const stackScreenOptions = useStackScreenOptions();
  const [navReady, setNavReady] = useState(false);
  const paymentHandlersEnabled = Boolean(token) && navReady;

  usePaymentDeepLink({ enabled: paymentHandlersEnabled });

  if (isLoading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
        <Text style={[styles.loaderText, { color: colors.textSecondary }]}>{t("app.preparing")}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => setNavReady(true)}
      onStateChange={() => {
        if (navigationRef.isReady()) setNavReady(true);
      }}
      theme={{
        dark: isDark,
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
      <Stack.Navigator screenOptions={stackScreenOptions}>
        {!token ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : user?.role === "Delivery" ? (
          <Stack.Screen
            name="DeliveryMain"
            component={DeliveryNavigator}
            options={{ headerShown: false }}
          />
        ) : user?.role === "Depot" ? (
          <Stack.Screen name="DepotMain" component={DepotRootNavigator} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="Main" component={CustomerMain} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AppRoot() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bootstrapI18n()
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <View style={styles.bootLoader}>
          <ActivityIndicator size="large" color="#111" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <AppRoot />
      </I18nextProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
  },
  bootLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F8",
  },
});
