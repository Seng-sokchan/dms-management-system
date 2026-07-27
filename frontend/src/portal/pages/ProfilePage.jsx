import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../../components/ui/LanguageSwitcher";
import { useConfirm } from "../../components/ui/ConfirmProvider";
import { SectionHeader } from "../components/SectionHeader";
import { PortalButton } from "../components/PortalButton";

export function ProfilePage({ user, onLogout }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();

  async function handleLogout() {
    if (
      !(await confirm({
        title: t("confirm.signOutTitle"),
        message: t("confirm.signOutMessage"),
        tone: "danger",
      }))
    ) {
      return;
    }
    onLogout();
  }

  return (
    <div>
      <SectionHeader
        title={t("portal.profile.title")}
        subtitle={t("portal.profile.subtitle")}
      />

      <article className="portal-card">
        <h3>{user?.name || user?.username || "—"}</h3>
        <p className="portal-card-meta">{user?.username}</p>
        <p className="portal-card-meta">{user?.role}</p>
        {user?.phone ? <p className="portal-card-meta">{user.phone}</p> : null}
      </article>

      <article className="portal-card">
        <h3>{t("language.label")}</h3>
        <div style={{ marginTop: 10 }}>
          <LanguageSwitcher />
        </div>
      </article>

      <div className="portal-actions">
        <PortalButton tone="soft" block onClick={() => void handleLogout()}>
          {t("auth.signOut")}
        </PortalButton>
      </div>
    </div>
  );
}
