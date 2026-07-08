import React, { useCallback, useMemo } from "react";
import { FlatList, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import PaymentAmountCard from "../components/payment/PaymentAmountCard";
import PaymentMethodOption from "../components/payment/PaymentMethodOption";
import { AbaKhqrMethodIcon } from "../components/payment/PaymentMethodIcons";
import { usePaymentCheckoutStyles } from "../components/payment/usePaymentCheckoutStyles";
import { Screen } from "../components/ui";
import { useAbaKhqrCheckout } from "../hooks/useAbaKhqrCheckout";
import { usePaymentAmountOptions } from "../hooks/usePaymentAmountOptions";
import { getApiErrorMessage } from "../services/apiClient";
import { createBatchPaymentIntent, getOrderPayment } from "../services/paymentsApi";
import { formatPaymentAmount } from "../utils/formatPaymentAmount";

export default function BatchOrderPaymentScreen({ route, navigation }) {
  const batchId = route.params?.batchId;
  const orders = useMemo(
    () => (Array.isArray(route.params?.orders) ? route.params.orders : []),
    [route.params?.orders],
  );
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const { showError } = useAlert();
  const styles = usePaymentCheckoutStyles();
  const {
    currency,
    setCurrency,
    amount,
    loading: loadingAmounts,
  } = usePaymentAmountOptions({ token, orders });

  const amountLabel = useMemo(
    () => (amount != null ? formatPaymentAmount(amount, currency) : ""),
    [amount, currency],
  );
  const orderIds = useMemo(() => orders.map((order) => order.id), [orders]);
  const merchantName = t("payment.storeName");

  const buildPendingReturn = useCallback(
    (resolved) => ({
      paymentId: resolved.paymentId,
      orderId: orderIds[0] ?? null,
      batchId,
      orderIds,
      orders,
      role: user?.role || "Depot",
    }),
    [batchId, orderIds, orders, user?.role],
  );

  const onPaymentSuccess = useCallback(
    (paymentId, { fromAbaReturn = false } = {}) => {
      if (!paymentId) return;
      navigation.replace("PaymentResult", {
        paymentId,
        orderId: orderIds[0] ?? null,
        batchId,
        orderIds,
        fromAbaReturn,
      });
    },
    [batchId, navigation, orderIds],
  );

  const resumePaymentLookup = useCallback(
    async (authToken) => {
      const firstOrderId = orderIds[0];
      if (!firstOrderId) return null;
      const data = await getOrderPayment(authToken, firstOrderId);
      const paymentId = data?.payment?.paymentId;
      if (data?.paymentStatus === "unpaid" && paymentId && data?.payment?.liveCheckActive) {
        return paymentId;
      }
      return null;
    },
    [orderIds],
  );

  const { submitting, startCheckout, checkoutModals } = useAbaKhqrCheckout({
    token,
    user,
    amountLabel,
    merchantName,
    buildPendingReturn,
    onPaymentSuccess,
    resumePaymentLookup,
  });

  const handleAbaKhqrPay = () => {
    if (!token || !batchId || loadingAmounts || amount == null) return;
    void startCheckout(async () => {
      try {
        return await createBatchPaymentIntent(token, {
          batchId,
          paymentOption: "checkout",
          currency,
        });
      } catch (err) {
        showError(
          t("depot.batchPaymentFailedTitle"),
          getApiErrorMessage(err, t("depot.batchPaymentFailedDefault")),
        );
        throw err;
      }
    });
  };

  if (!batchId || orders.length === 0) {
    return (
      <Screen>
        <Text>{t("depot.batchPaymentMissing")}</Text>
      </Screen>
    );
  }

  return (
    <Screen busy={submitting} busyMessage={t("payment.starting")}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.orderSummaryCard}>
          <FlatList
            data={orders}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.lineRow,
                  index === orders.length - 1 && styles.lineRowLast,
                ]}
              >
                <Text style={styles.lineTitle}>
                  {t("payment.orderLabel", { id: item.id })}
                </Text>
                <Text style={styles.lineMeta}>
                  {item.customerName || "-"} · {item.itemName || "-"}
                </Text>
                <Text style={styles.lineMeta}>
                  {t("depot.batchOrderQuantity", { qty: Number(item.orderedQty || 0) })}
                </Text>
              </View>
            )}
          />
        </View>

        <PaymentAmountCard
          label={t("payment.amountToPay")}
          amount={amount}
          currency={currency}
          onCurrencyChange={setCurrency}
          loading={loadingAmounts}
        />

        <Text style={styles.title}>{t("payment.choosePaymentTitle")}</Text>

        <View style={styles.list}>
          <PaymentMethodOption
            icon={<AbaKhqrMethodIcon />}
            title={t("payment.methodAbaKhqr")}
            subtitle={t("payment.methodAbaKhqrHint")}
            onPress={handleAbaKhqrPay}
          />
        </View>
      </ScrollView>

      {checkoutModals}
    </Screen>
  );
}
