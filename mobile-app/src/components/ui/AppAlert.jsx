import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import AppIcon from "./AppIcon";
import PrimaryButton from "./PrimaryButton";

export const ALERT_TONES = Object.freeze({
  error: "error",
  success: "success",
  warning: "warning",
  info: "info",
});

const TONE_META = {
  error: {
    icon: "alert-circle",
    softKey: "dangerSoft",
    accentKey: "danger",
    buttonTone: "primary",
  },
  success: {
    icon: "check-circle",
    softKey: "successSoft",
    accentKey: "success",
    buttonTone: "success",
  },
  warning: {
    icon: "alert",
    softKey: "warningSoft",
    accentKey: "textPrimary",
    buttonTone: "primary",
  },
  info: {
    icon: "information",
    softKey: "surfaceSoft",
    accentKey: "textPrimary",
    buttonTone: "primary",
  },
};

function resolveTone(tone) {
  return TONE_META[tone] ? tone : ALERT_TONES.info;
}

/**
 * Themed modal alert (error / success / warning / info).
 * Prefer `useAlert()` / `showAppAlert()` for imperative usage.
 */
export default function AppAlert({
  visible,
  title,
  message,
  tone = ALERT_TONES.info,
  actions,
  onRequestClose,
  dismissible = true,
  testID = "app-alert",
}) {
  const { t } = useTranslation();
  const { colors, layout, radii, sizes, spacing, typography, borders } = useTheme();
  const resolvedTone = resolveTone(tone);
  const meta = TONE_META[resolvedTone];
  const accent = colors[meta.accentKey] || colors.textPrimary;
  const softBg = colors[meta.softKey] || colors.surfaceSoft;

  const normalizedActions = useMemo(() => {
    if (Array.isArray(actions) && actions.length > 0) return actions;
    return [{ text: t("common.ok"), style: "default" }];
  }, [actions, t]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: colors.overlay,
          padding: spacing.lg,
          justifyContent: "center",
          alignItems: "center",
        },
        card: {
          width: "100%",
          maxWidth: layout.modalMaxWidth,
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          padding: spacing.lg,
          ...borders.panel,
        },
        iconWrap: {
          width: sizes.iconLg,
          height: sizes.iconLg,
          borderRadius: sizes.iconLg / 2,
          backgroundColor: softBg,
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "center",
        },
        title: {
          marginTop: spacing.md,
          textAlign: "center",
          fontSize: typography.h3,
          fontWeight: "800",
          color: colors.textPrimary,
        },
        message: {
          marginTop: spacing.sm,
          textAlign: "center",
          fontSize: typography.body,
          color: colors.textSecondary,
          lineHeight: 22,
        },
        actions: {
          marginTop: spacing.lg,
          gap: spacing.sm,
        },
        textAction: {
          minHeight: sizes.touchTarget,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: spacing.md,
        },
        textActionLabel: {
          fontSize: typography.button,
          fontWeight: "700",
          color: colors.textSecondary,
        },
        destructiveLabel: {
          color: colors.danger,
        },
      }),
    [borders.panel, colors, layout.modalMaxWidth, radii.xl, sizes, softBg, spacing, typography],
  );

  function handleActionPress(action) {
    onRequestClose?.();
    action?.onPress?.();
  }

  function handleBackdropPress() {
    if (!dismissible) return;
    onRequestClose?.();
  }

  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (dismissible) onRequestClose?.();
      }}
      statusBarTranslucent
    >
      <Pressable
        style={styles.overlay}
        onPress={handleBackdropPress}
        accessibilityViewIsModal
        testID={`${testID}-overlay`}
      >
        <Pressable
          style={styles.card}
          onPress={(e) => e.stopPropagation()}
          accessibilityRole="alert"
          testID={testID}
        >
          <View style={styles.iconWrap} testID={`${testID}-icon-${resolvedTone}`}>
            <AppIcon name={meta.icon} size={26} color={accent} />
          </View>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.actions}>
            {normalizedActions.map((action, index) => {
              const key = `${action.text}-${index}`;
              const isCancel = action.style === "cancel";
              const isDestructive = action.style === "destructive";
              const isSoft = action.style === "soft";
              const isLast = index === normalizedActions.length - 1;
              const isFilled =
                action.style === "default" ||
                (!isCancel && !isDestructive && !isSoft && (action.style == null ? isLast : true));

              if (isCancel || isDestructive) {
                return (
                  <Pressable
                    key={key}
                    onPress={() => handleActionPress(action)}
                    style={styles.textAction}
                    accessibilityRole="button"
                    accessibilityLabel={action.text}
                    testID={`${testID}-action-${index}`}
                  >
                    <Text
                      style={[styles.textActionLabel, isDestructive && styles.destructiveLabel]}
                    >
                      {action.text}
                    </Text>
                  </Pressable>
                );
              }

              return (
                <PrimaryButton
                  key={key}
                  title={action.text}
                  onPress={() => handleActionPress(action)}
                  tone={isFilled && !isSoft ? meta.buttonTone : "soft"}
                  accessibilityLabel={action.text}
                  testID={`${testID}-action-${index}`}
                />
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
