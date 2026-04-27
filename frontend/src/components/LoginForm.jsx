import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function LoginForm({ auth, setAuth, onSubmit, message, messageVariant = "success" }) {
  const { t } = useTranslation();

  return (
    <main className="auth-container">
      <LanguageSwitcher className="auth-lang" />
      <section className="auth-card" aria-labelledby="auth-heading">
        <p className="eyebrow">{t("auth.eyebrow")}</p>
        <h1 id="auth-heading" className="auth-title">
          {t("auth.title")}
        </h1>
        <p className="muted">{t("auth.blurb")}</p>
        <form className="form" onSubmit={onSubmit}>
          <label className="form-label" htmlFor="login-username">
            {t("auth.username")}
          </label>
          <input
            id="login-username"
            value={auth.username}
            onChange={(event) => setAuth({ ...auth, username: event.target.value })}
            placeholder={t("auth.username")}
            autoComplete="username"
            aria-label={t("auth.username")}
          />
          <label className="form-label" htmlFor="login-password">
            {t("auth.password")}
          </label>
          <input
            id="login-password"
            type="password"
            value={auth.password}
            onChange={(event) => setAuth({ ...auth, password: event.target.value })}
            placeholder={t("auth.password")}
            autoComplete="current-password"
            aria-label={t("auth.password")}
          />
          <button type="submit" className="btn-primary form-submit">
            {t("auth.signIn")}
          </button>
        </form>
        {message ? (
          <p className={`message${messageVariant === "error" ? " message--error" : ""}`}>{message}</p>
        ) : null}
      </section>
    </main>
  );
}

