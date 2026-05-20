import { useTranslation } from "react-i18next";
import loginBgDefault from "../../assets/eva-cambodia.jpg";
import "./LoginForm.css";

/** Optional: public path or URL in `.env` — overrides the bundled Eva Cambodia photo. */
const loginBgFromEnv =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_LOGIN_BG_URL
    ? String(import.meta.env.VITE_LOGIN_BG_URL).trim()
    : "";

const loginBackdropUrl = loginBgFromEnv || loginBgDefault;

export function LoginForm({ auth, setAuth, onSubmit, message, messageVariant = "success" }) {
  const { t } = useTranslation();

  return (
    <main className="auth-shell">
      <div
        className="auth-bg"
        aria-hidden="true"
        style={{
          "--auth-login-bg-url": `url(${JSON.stringify(loginBackdropUrl)})`,
        }}
      />
      <div className="auth-bg-overlay" aria-hidden="true" />

      <div className="auth-glass-frame">
        <section className="auth-glass-card" aria-labelledby="auth-heading">
          <h1 id="auth-heading" className="auth-glass-title">
            {t("auth.loginHeading")}
          </h1>

          <form className="auth-glass-form" onSubmit={onSubmit} noValidate>
            <div className="auth-glass-field">
              <label className="sr-only" htmlFor="login-username">
                {t("auth.username")}
              </label>
              <input
                id="login-username"
                className="auth-glass-input"
                value={auth.username}
                onChange={(event) => setAuth({ ...auth, username: event.target.value })}
                placeholder={t("auth.placeholderUsername")}
                autoComplete="username"
              />
            </div>

            <div className="auth-glass-field">
              <label className="sr-only" htmlFor="login-password">
                {t("auth.password")}
              </label>
              <input
                id="login-password"
                className="auth-glass-input"
                type="password"
                value={auth.password}
                onChange={(event) => setAuth({ ...auth, password: event.target.value })}
                placeholder={t("auth.placeholderPassword")}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="auth-glass-submit">
              {t("auth.logIn")}
            </button>
          </form>

          {message ? (
            <p
              className={`auth-glass-feedback${messageVariant === "error" ? " auth-glass-feedback--error" : ""}`}
              role={messageVariant === "error" ? "alert" : "status"}
            >
              {message}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
