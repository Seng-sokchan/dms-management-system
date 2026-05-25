import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthenticatedTabs from "./AuthenticatedTabs";
import OrderPaymentScreen from "../screens/OrderPaymentScreen";
import PaymentResultScreen from "../screens/PaymentResultScreen";
import { useStackScreenOptions } from "./screenOptions";
import { useTranslation } from "react-i18next";

const Stack = createNativeStackNavigator();

export default function CustomerRootNavigator() {
  const stackScreenOptions = useStackScreenOptions();
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Tabs" component={AuthenticatedTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="OrderPayment"
        component={OrderPaymentScreen}
        options={{ title: t("payment.checkoutTitle") }}
      />
      <Stack.Screen
        name="PaymentResult"
        component={PaymentResultScreen}
        options={{ title: t("payment.resultTitle") }}
      />
    </Stack.Navigator>
  );
}
