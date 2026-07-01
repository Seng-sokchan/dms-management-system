import React, { useCallback, useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import PaymentMethodOption from "../components/payment/PaymentMethodOption";
import { AbaKhqrMethodIcon } from "../components/payment/PaymentMethodIcons";
import { usePaymentCheckoutStyles } from "../components/payment/usePaymentCheckoutStyles";
import { Screen } from "../components/ui";
import { useAbaKhqrCheckout } from "../hooks/useAbaKhqrCheckout";
import { createPaymentIntent, getOrderPayment } from "../services/paymentsApi";
import { formatPaymentAmount } from "../utils/formatPaymentAmount";

export default function OrderPaymentScreen({ route, navigation }) {
  const order = route.params?.order;
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const styles = usePaymentCheckoutStyles();

  const amountLabel = useMemo(
    () => formatPaymentAmount(order?.amountTotal, order?.currency),
    [order?.amountTotal, order?.currency],
  );
  const merchantName = t("payment.storeName");

  const buildPendingReturn = useCallback(
    (resolved) => ({
      paymentId: resolved.paymentId,
      orderId: order.id,
      order,
      role: user?.role || "Customer",
    }),
    [order, user?.role],
  );

  const onPaymentSuccess = useCallback(
    (paymentId, { fromAbaReturn = false } = {}) => {
      if (!paymentId || !order?.id) return;
      navigation.replace("PaymentResult", {
        paymentId,
        orderId: order.id,
        fromAbaReturn,
      });
    },
    [navigation, order?.id],
  );

  const resumePaymentLookup = useCallback(
    async (authToken) => {
      if (!order?.id) return null;
      const data = await getOrderPayment(authToken, order.id);
      const paymentId = data?.payment?.paymentId;
      if (data?.paymentStatus === "unpaid" && paymentId && data?.payment?.liveCheckActive) {
        return paymentId;
      }
      return null;
    },
    [order?.id],
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
    if (!token || !order?.id) return;
    void startCheckout(() =>
      createPaymentIntent(token, {
        orderId: order.id,
        paymentOption: "checkout",
      }),
    );
  };

  if (!order) {
    return (
      <Screen>
        <Text>{t("payment.orderMissing")}</Text>
      </Screen>
    );
  }

  return (
    <Screen busy={submitting} busyMessage={t("payment.starting")}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.orderSummarySubtitle}>{t("payment.checkoutOrderSubtitle")}</Text>

        <View style={styles.orderSummaryCard}>
          <View style={[styles.lineRow, styles.lineRowLast]}>
            <Text style={styles.lineTitle}>{t("payment.orderLabel", { id: order.id })}</Text>
            <Text style={styles.lineMeta}>{order.itemName || "-"}</Text>
            <Text style={styles.lineMeta}>
              {t("depot.batchOrderQuantity", { qty: Number(order.orderedQty || 0) })}
            </Text>
          </View>
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>{t("payment.amountToPay")}</Text>
          <Text style={styles.amountValue}>{amountLabel}</Text>
        </View>

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
