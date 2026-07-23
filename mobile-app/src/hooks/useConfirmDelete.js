import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAlert } from "../context/AlertContext";

export function useConfirmDelete() {
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  return useCallback(
    (message, onConfirm) => {
      showAlert({
        title: t("admin.common.deleteTitle"),
        message: message || t("admin.common.deleteMessage"),
        tone: "error",
        dismissible: true,
        actions: [
          { text: t("admin.common.cancel"), style: "cancel" },
          {
            text: t("admin.common.delete"),
            style: "destructive",
            onPress: () => {
              void onConfirm();
            },
          },
        ],
      });
    },
    [showAlert, t],
  );
}
