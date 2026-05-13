import { API_BASE_URL } from "../config/appConfig";

/** Socket.IO attaches to the HTTP server root (strip `/api` from REST base URL). */
export function getSocketBaseUrl() {
  return String(API_BASE_URL || "").replace(/\/api\/?$/i, "");
}
