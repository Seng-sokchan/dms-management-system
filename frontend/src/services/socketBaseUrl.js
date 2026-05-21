const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/v1";

/** Socket.IO is mounted on the HTTP server root (strip `/v1` from REST base URL). */
export function getSocketBaseUrl() {
  return String(apiBaseUrl || "").replace(/\/v1\/?$/i, "");
}
