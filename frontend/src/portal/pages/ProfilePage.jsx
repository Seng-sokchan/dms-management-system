import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../../components/ui/ConfirmProvider";
import { getApiErrorMessage } from "../../services/apiClient";
import { SectionHeader } from "../components/SectionHeader";
import { PortalSettingsSection } from "../components/PortalSettingsSection";
import { TabIcon } from "../components/TabIcon";
import { deleteMyAccount } from "../services/auth";
import "./ProfilePage.css";

function pickLabel(user, key) {
  if (!user) return "—";
  const v = user[key];
  return v != null && String(v).trim() !== "" ? String(v) : "—";
}

function roleSubtitle(role, t) {
  if (role === "Admin") return t("portal.profile.roleAdmin");
  if (role === "Owner") return t("portal.profile.roleOwner");
  if (role === "Delivery") return t("portal.profile.roleDelivery");
  if (role === "Depot") return t("portal.profile.roleDepot");
  return t("portal.profile.roleCustomer");
}

export function ProfilePage({ token, user, onLogout }) {
  const { t } = useTranslation();
  const { confirm, alert } = useConfirm();
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const busy = signingOut || deleting;

  async function handleSignOut() {
    if (busy) return;
    setSigningOut(true);
    try {
      onLogout();
    } finally {
      setSigningOut(false);
    }
  }

  async function performDeleteAccount() {
    if (!token || deleting) return;
    setDeleting(true);
    try {
      await deleteMyAccount(token);
      onLogout();
    } catch (error) {
      await alert({
        title: t("portal.profile.deleteAccountFailed"),
        message: getApiErrorMessage(error, t("portal.profile.deleteAccountFailedDefault")),
        tone: "primary",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteAccount() {
    if (busy) return;
    const ok = await confirm({
      title: t("portal.profile.deleteAccountTitle"),
      message: t("portal.profile.deleteAccountMessage"),
      confirmLabel: t("portal.profile.deleteAccountConfirm"),
      tone: "danger",
    });
    if (!ok) return;
    await performDeleteAccount();
  }

  return (
    <div className={`portal-profile${busy ? " portal-profile--busy" : ""}`}>
      <SectionHeader
        title={t("portal.profile.title")}
        subtitle={roleSubtitle(user?.role, t)}
        action={
          <button
            type="button"
            className="portal-profile__sign-out"
            onClick={() => void handleSignOut()}
            disabled={busy}
            aria-label={t("portal.profile.signOut")}
          >
            <TabIcon name="logout" active />
            <span>{t("portal.profile.signOut")}</span>
          </button>
        }
      />

      <article className="portal-card portal-profile__fields">
        <p className="portal-profile__field-label">{t("portal.profile.username")}</p>
        <p className="portal-profile__field-value">{pickLabel(user, "username")}</p>

        <p className="portal-profile__field-label portal-profile__field-label--spaced">
          {t("portal.profile.name")}
        </p>
        <p className="portal-profile__field-value">{pickLabel(user, "name")}</p>

        <p className="portal-profile__field-label portal-profile__field-label--spaced">
          {t("portal.profile.role")}
        </p>
        <p className="portal-profile__field-value">{pickLabel(user, "role")}</p>

        <p className="portal-profile__field-label portal-profile__field-label--spaced">
          {t("portal.profile.phone")}
        </p>
        <p className="portal-profile__field-value">{pickLabel(user, "phone")}</p>
      </article>

      <PortalSettingsSection />

      <article className="portal-card portal-profile__danger">
        <h3 className="portal-profile__danger-title">{t("portal.profile.deleteAccount")}</h3>
        <p className="portal-profile__danger-body">{t("portal.profile.deleteAccountHint")}</p>
        <button
          type="button"
          className="portal-profile__delete"
          onClick={() => void handleDeleteAccount()}
          disabled={busy}
          aria-label={t("portal.profile.deleteAccount")}
        >
          <TabIcon name="trash" active />
          <span>{t("portal.profile.deleteAccount")}</span>
        </button>
      </article>
    </div>
  );
}
