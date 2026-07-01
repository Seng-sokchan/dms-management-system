import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import PaymentSuccessIllustration from "../components/payment/PaymentSuccessIllustration";
import { AbaKhqrLogoMark } from "../components/payment/PaymentMethodIcons";
import { Screen } from "../components/ui";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { clearPendingPaymentReturn } from "../services/paymentPendingStorage";
import { formatPaymentAmount } from "../utils/formatPaymentAmount";
import { hasMobileMenu } from "../utils/mobileAccess";

export default function PaymentResultScreen({ route, navigation }) {
  const paymentIdParam = route.params?.paymentId;
  const orderIdParam = route.params?.orderId;
  const batchIdParam = route.params?.batchId;
  const orderIdsParam = Array.isArray(route.params?.orderIds) ? route.params.orderIds : null;
  const { user } = useAuth();
  const { t } = useTranslation();
  const { colors, radii, spacing, typography } = useTheme();

  const { status, payment, loading, error } = usePaymentStatus(paymentIdParam, {
    autoRefresh: true,
  });

  const [redirecting, setRedirecting] = useState(false);

  const isPaid = status === "paid";
  const email = user?.email || user?.username || t("payment.successEmailFallback");

  useEffect(() => {
    if (loading || !paymentIdParam || isPaid) return undefined;

    setRedirecting(true);
    const timer = setTimeout(() => {
      if (batchIdParam) {
        navigation.replace("BatchOrderPayment", {
          batchId: batchIdParam,
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
  }, [batchIdParam, isPaid, loading, navigation, orderIdParam, orderIdsParam, paymentIdParam]);

  useEffect(() => {
    if (loading || !paymentIdParam) return;
    if (isPaid) {
      void clearPendingPaymentReturn();
    }
  }, [isPaid, loading, paymentIdParam]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isPaid ? t("payment.successTitle") : t("payment.loading"),
    });
  }, [isPaid, navigation, t]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: spacing.xl,
        },
        storeRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          marginBottom: spacing.lg,
        },
        storeBadge: {
          marginRight: spacing.xs,
        },
        storeName: {
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        successTitle: {
          fontSize: 32,
          fontWeight: "800",
          color: colors.textPrimary,
          marginTop: spacing.md,
        },
        successHint: {
          marginTop: spacing.md,
          fontSize: typography.bodySmall,
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 22,
          paddingHorizontal: spacing.md,
        },
        amount: {
          marginTop: spacing.lg,
          fontSize: typography.title,
          fontWeight: "800",
          color: colors.textPrimary,
        },
        actions: {
          width: "100%",
          marginTop: spacing.xxl,
          gap: spacing.md,
        },
        outlineButton: {
          borderWidth: 1.5,
          borderColor: ABA_KHQR_TEAL,
          borderRadius: radii.pill,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          alignItems: "center",
        },
        outlineButtonText: {
          color: ABA_KHQR_TEAL,
          fontSize: typography.button,
          fontWeight: "700",
        },
        primaryButton: {
          backgroundColor: ABA_KHQR_TEAL,
          borderRadius: radii.pill,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          alignItems: "center",
        },
        primaryButtonText: {
          color: ABA_KHQR_WHITE,
          fontSize: typography.button,
          fontWeight: "700",
        },
        error: {
          marginTop: spacing.md,
          color: colors.danger,
          fontSize: typography.bodySmall,
          textAlign: "center",
        },
        pendingWrap: {
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
        },
        pendingText: {
          marginTop: spacing.md,
          color: colors.textMuted,
          fontSize: typography.bodySmall,
          textAlign: "center",
        },
      }),
    [colors, radii, spacing, typography],
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
    <Screen busy={loading && !payment} busyMessage={t("payment.loading")}>
      <View style={styles.content}>
        <View style={styles.storeRow}>
          <View style={styles.storeBadge}>
            <AbaKhqrLogoMark size={32} />
          </View>
          <Text style={styles.storeName}>{t("payment.storeName")}</Text>
        </View>

        <PaymentSuccessIllustration />

        <Text style={styles.successTitle}>{t("payment.successTitle")}</Text>
        <Text style={styles.successHint}>
          {t("payment.successEmailHint", { email })}
        </Text>

        {payment?.amount != null ? (
          <Text style={styles.amount}>
            {formatPaymentAmount(payment.amount, payment.currency)}
          </Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
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
