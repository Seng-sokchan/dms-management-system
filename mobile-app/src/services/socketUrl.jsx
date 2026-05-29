import { API_BASE_URL } from "../config/appConfig";

/** Socket.IO attaches to the HTTP server root (strip `/v1` from REST base URL). */
export function getSocketBaseUrl() {
  return String(API_BASE_URL || "").replace(/\/v1\/?$/i, "");
}
