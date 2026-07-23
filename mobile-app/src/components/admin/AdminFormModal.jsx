import React, { useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import PrimaryButton from "../ui/PrimaryButton";
import { useTheme } from "../../context/ThemeContext";

/**
 * fields: [{ key, label, placeholder?, keyboardType?, multiline? }]
 * selectFields: [{ key, label, options: [{ id, label }] }]
 */
export default function AdminFormModal({
  visible,
  title,
  values,
  onChange,
  fields = [],
  selectFields = [],
  onSubmit,
  onClose,
  busy = false,
  submitLabel,
}) {
  const { t } = useTranslation();
  const { colors, spacing, typography, radii, borders } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: "flex-end",
        },
        sheet: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          padding: spacing.lg,
          maxHeight: "85%",
        },
        title: {
          fontSize: typography.h3,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: spacing.md,
        },
        label: {
          fontSize: typography.caption,
          fontWeight: "600",
          color: colors.textMuted,
          marginBottom: spacing.xs,
          marginTop: spacing.sm,
        },
        input: {
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: colors.background,
          color: colors.textPrimary,
          fontSize: typography.body,
          ...borders.panel,
        },
        optionsWrap: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.xs,
        },
        option: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radii.pill,
          backgroundColor: colors.surfaceSoft,
          ...borders.panel,
        },
        optionActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        optionText: {
          fontSize: typography.bodySmall,
          color: colors.textPrimary,
          fontWeight: "600",
        },
        optionTextActive: {
          color: colors.onPrimary,
        },
        actions: {
          marginTop: spacing.lg,
          gap: spacing.sm,
        },
        cancel: {
          alignItems: "center",
          paddingVertical: spacing.md,
        },
        cancelText: {
          color: colors.textSecondary,
          fontWeight: "600",
        },
      }),
    [borders.panel, colors, radii, spacing, typography],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            {fields.map((field) => (
              <View key={field.key}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={[styles.input, field.multiline && { minHeight: 80, textAlignVertical: "top" }]}
                  value={String(values[field.key] ?? "")}
                  onChangeText={(text) => onChange({ ...values, [field.key]: text })}
                  placeholder={field.placeholder || ""}
                  placeholderTextColor={colors.textMuted}
                  keyboardType={field.keyboardType || "default"}
                  multiline={Boolean(field.multiline)}
                  autoCapitalize={field.autoCapitalize || "sentences"}
                  secureTextEntry={Boolean(field.secure)}
                />
              </View>
            ))}
            {selectFields.map((field) => (
              <View key={field.key}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={styles.optionsWrap}>
                  {(field.options || []).map((opt) => {
                    const active = String(values[field.key] ?? "") === String(opt.id);
                    return (
                      <Pressable
                        key={String(opt.id)}
                        style={[styles.option, active && styles.optionActive]}
                        onPress={() => onChange({ ...values, [field.key]: String(opt.id) })}
                      >
                        <Text style={[styles.optionText, active && styles.optionTextActive]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            <PrimaryButton
              title={submitLabel || t("admin.common.save")}
              onPress={onSubmit}
              loading={busy}
              disabled={busy}
            />
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>{t("admin.common.cancel")}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
