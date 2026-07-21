import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { useConfirm } from "../components/ui/ConfirmProvider";
import { getApiErrorMessage } from "../services/apiClient";
import {
  fetchSpecialDaySettings,
  updateSpecialDaySettings,
} from "../services/adminApi/systemSettings";
import "./SystemSettingsPage.css";

export function SystemSettingsPage({ token }) {
  const { t } = useTranslation();
  const { confirm, alert } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [limit, setLimit] = useState(1);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchSpecialDaySettings(token);
      setEnabled(Boolean(data?.enabled));
      setLimit(Number(data?.unpaidReceivedLimit) === 2 ? 2 : 1);
    } catch (err) {
      setError(getApiErrorMessage(err, t("systemSettings.loadError")));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleToggle() {
    const next = !enabled;
    const ok = await confirm({
      title: next
        ? t("systemSettings.enableConfirmTitle")
        : t("systemSettings.disableConfirmTitle"),
      message: next
        ? t("systemSettings.enableConfirmMessage")
        : t("systemSettings.disableConfirmMessage"),
    });
    if (!ok) return;

    setSaving(true);
    setError("");
    try {
      const data = await updateSpecialDaySettings(token, { enabled: next });
      setEnabled(Boolean(data?.enabled));
      setLimit(Number(data?.unpaidReceivedLimit) === 2 ? 2 : 1);
      await alert({
        title: t("systemSettings.savedTitle"),
        message: next
          ? t("systemSettings.enabledMessage")
          : t("systemSettings.disabledMessage"),
      });
    } catch (err) {
      setError(getApiErrorMessage(err, t("systemSettings.saveError")));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("systemSettings.title")}</h2>
        <p className="section-lead">{t("systemSettings.lead")}</p>
      </div>

      {error ? <p className="system-settings-error" role="alert">{error}</p> : null}

      <div className="system-settings-card">
        <div className="system-settings-card-text">
          <h3>{t("systemSettings.specialDayTitle")}</h3>
          <p>{t("systemSettings.specialDayDescription")}</p>
          <p className="system-settings-meta">
            {loading
              ? t("systemSettings.loading")
              : t("systemSettings.currentLimit", { limit })}
          </p>
        </div>
        <div className="system-settings-card-actions">
          <span
            className={`system-settings-badge ${enabled ? "is-on" : "is-off"}`}
            aria-live="polite"
          >
            {enabled ? t("systemSettings.statusOn") : t("systemSettings.statusOff")}
          </span>
          <Button
            type="button"
            variant={enabled ? "ghost" : "primary"}
            onClick={() => void handleToggle()}
            disabled={loading || saving || !token}
            aria-busy={saving}
          >
            {saving
              ? t("systemSettings.saving")
              : enabled
                ? t("systemSettings.turnOff")
                : t("systemSettings.turnOn")}
          </Button>
        </div>
      </div>
    </section>
  );
}
