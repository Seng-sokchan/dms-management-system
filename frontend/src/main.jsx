import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ConfirmProvider } from "./components/ui/ConfirmProvider";
import "./i18n/config.js";
import "./index.css";
import App from "./App.jsx";
import { DownloadAppPage } from "./pages/DownloadAppPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsOfServicePage } from "./pages/TermsOfServicePage";

(() => {
  const href = "/logo.png";
  const ensure = (rel, mime) => {
    let link = document.querySelector(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement("link");
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = href;
    if (mime) link.type = mime;
    else link.removeAttribute("type");
  };
  ensure("icon", "image/png");
  ensure("apple-touch-icon");
})();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/download-app" element={<DownloadAppPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route
          path="*"
          element={
            <ConfirmProvider>
              <App />
            </ConfirmProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
