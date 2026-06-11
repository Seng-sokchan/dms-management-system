import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { DepotBatchCartProvider } from "../context/DepotBatchCartContext";
import DepotNavigator from "./DepotNavigator";
import OrderPaymentScreen from "../screens/OrderPaymentScreen";
import BatchOrderPaymentScreen from "../screens/BatchOrderPaymentScreen";
import PaymentResultScreen from "../screens/PaymentResultScreen";
import { useStackScreenOptions } from "./screenOptions";

const Stack = createNativeStackNavigator();

export default function DepotRootNavigator() {
  const stackScreenOptions = useStackScreenOptions();
  const { t } = useTranslation();

  return (
    <DepotBatchCartProvider>
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Tabs" component={DepotNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="OrderPayment"
        component={OrderPaymentScreen}
        options={{ title: t("payment.checkoutTitle") }}
      />
      <Stack.Screen
        name="BatchOrderPayment"
        component={BatchOrderPaymentScreen}
        options={{ title: t("depot.batchCheckoutTitle") }}
      />
      <Stack.Screen
        name="PaymentResult"
        component={PaymentResultScreen}
        options={{ title: t("payment.resultTitle") }}
      />
    </Stack.Navigator>
    </DepotBatchCartProvider>
  );
}
