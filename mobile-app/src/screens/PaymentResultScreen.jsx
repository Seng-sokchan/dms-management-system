import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import PaymentSuccessIllustration from "../components/payment/PaymentSuccessIllustration";
import { Screen } from "../components/ui";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { clearPendingPaymentReturn } from "../services/paymentPendingStorage";
import { formatPaymentAmount } from "../utils/formatPaymentAmount";
import { hasMobileMenu } from "../utils/mobileAccess";
import { ABA_KHQR_TEAL, ABA_KHQR_WHITE } from "../theme/abaKhqrBrand";

const logoImage = require("../../assets/images/logo.png");
const SUCCESS_GREEN = "#42B56E";

export default function PaymentResultScreen({ route, navigation }) {
  const paymentIdParam = route.params?.paymentId;
  const orderIdParam = route.params?.orderId;
  const masterOrderIdParam = route.params?.masterOrderId;
  const orderIdsParam = Array.isArray(route.params?.orderIds) ? route.params.orderIds : null;
  const { user } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { status, payment, loading, error } = usePaymentStatus(paymentIdParam, {
    autoRefresh: true,
  });

  const [redirecting, setRedirecting] = useState(false);

  const isPaid = status === "paid";
  const customerName = user?.name || user?.username || t("payment.successNameFallback");

  useEffect(() => {
    if (loading || !paymentIdParam || isPaid) return undefined;

    setRedirecting(true);
    const timer = setTimeout(() => {
      if (masterOrderIdParam) {
        navigation.replace("BatchOrderPayment", {
          masterOrderId: masterOrderIdParam,
          orders: orderIdsParam?.map((id) => ({ id })) || [],
        });
        return;
      }
      if (orderIdParam) {
        navigation.replace("OrderPayment", { order: { id: orderIdParam } });
        return;
      }
      navigation.goBack();
    }, 1800);

    return () => clearTimeout(timer);
  }, [masterOrderIdParam, isPaid, loading, navigation, orderIdParam, orderIdsParam, paymentIdParam]);

  useEffect(() => {
    if (loading || !paymentIdParam) return;
    if (isPaid) {
      void clearPendingPaymentReturn();
    }
  }, [isPaid, loading, paymentIdParam]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: !isPaid,
      title: isPaid ? t("payment.successTitle") : t("payment.loading"),
    });
  }, [isPaid, navigation, t]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: "#FFFFFF",
        },
        header: {
          alignItems: "center",
          paddingTop: 16,
          paddingHorizontal: 24,
        },
        logo: {
          width: 52,
          height: 52,
          resizeMode: "contain",
        },
        storeName: {
          marginTop: 10,
          fontSize: 16,
          fontWeight: "600",
          color: "#1A1A1A",
          textAlign: "center",
        },
        body: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 28,
        },
        successTitle: {
          marginTop: 32,
          fontSize: 34,
          fontWeight: "800",
          color: "#1A1A1A",
          textAlign: "center",
        },
        successHint: {
          marginTop: 14,
          fontSize: 15,
          color: "#8A8A8A",
          textAlign: "center",
          lineHeight: 22,
          maxWidth: 300,
        },
        footer: {
          paddingHorizontal: 24,
          gap: 14,
        },
        outlineButton: {
          borderWidth: 1.5,
          borderColor: SUCCESS_GREEN,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: "center",
          backgroundColor: "#FFFFFF",
        },
        outlineButtonText: {
          color: SUCCESS_GREEN,
          fontSize: 16,
          fontWeight: "700",
        },
        primaryButton: {
          backgroundColor: SUCCESS_GREEN,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: "center",
        },
        primaryButtonText: {
          color: ABA_KHQR_WHITE,
          fontSize: 16,
          fontWeight: "700",
        },
        error: {
          marginTop: 12,
          color: "#D32F2F",
          fontSize: 14,
          textAlign: "center",
        },
        pendingWrap: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        },
        pendingText: {
          marginTop: 16,
          color: "#8A8A8A",
          fontSize: 14,
          textAlign: "center",
        },
      }),
    [],
  );

  const goBackToOrders = () => {
    if (hasMobileMenu(user, "mobile.depotOrders")) {
      navigation.navigate("Tabs", {
        screen: "DepotOrdersTab",
        params: { screen: "DepotOrders" },
      });
      return;
    }
    navigation.navigate("Tabs", { screen: "MyOrders" });
  };

  const handleDownloadReceipt = async () => {
    const amount = formatPaymentAmount(payment?.amount, payment?.currency);
    const lines = [
      t("payment.successTitle"),
      t("payment.storeName"),
      payment?.orderId ? `${t("payment.orderNumberLabel")}: #${payment.orderId}` : null,
      amount ? `${t("payment.total")}: ${amount}` : null,
      payment?.paidAt ? `${t("payment.paidAtLabel")}: ${new Date(payment.paidAt).toLocaleString()}` : null,
      `${t("payment.orderNumberLabel")} ID: ${paymentIdParam}`,
    ].filter(Boolean);

    try {
      await Share.share({ message: lines.join("\n"), title: t("payment.downloadReceipt") });
    } catch {
      // User dismissed share sheet.
    }
  };

  if (!isPaid) {
    return (
      <Screen busy={loading && !redirecting} busyMessage={t("payment.loading")}>
        <View style={styles.pendingWrap}>
          {redirecting ? (
            <Text style={styles.pendingText}>{t("payment.redirectingUnpaid")}</Text>
          ) : (
            <ActivityIndicator color={ABA_KHQR_TEAL} />
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      busy={loading && !payment}
      busyMessage={t("payment.loading")}
      edges={["top", "left", "right"]}
      contentStyle={{ paddingHorizontal: 0 }}
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <View style={styles.screen}>
        <View style={styles.header}>
          <Image source={logoImage} style={styles.logo} accessibilityLabel="App logo" />
          <Text style={styles.storeName}>{t("payment.storeName")}</Text>
        </View>

        <View style={styles.body}>
          <PaymentSuccessIllustration />
          <Text style={styles.successTitle}>{t("payment.successTitle")}</Text>
          <Text style={styles.successHint}>
            {t("payment.successNameHint", { name: customerName })}
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable style={styles.outlineButton} onPress={handleDownloadReceipt}>
            <Text style={styles.outlineButtonText}>{t("payment.downloadReceipt")}</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={goBackToOrders}>
            <Text style={styles.primaryButtonText}>{t("payment.continueShopping")}</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
