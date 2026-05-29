import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ConfirmProvider } from "./components/ui/ConfirmProvider";
import evaLogo from "./assets/eva-logo.jpg";
import "./i18n/config.js";
import "./index.css";
import App from "./App.jsx";
import { DownloadAppPage } from "./pages/DownloadAppPage";

(() => {
  const href = String(evaLogo);
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
  ensure("icon", "image/jpeg");
  ensure("apple-touch-icon");
})();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/download-app" element={<DownloadAppPage />} />
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
