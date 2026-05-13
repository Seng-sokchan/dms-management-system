const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

/** Socket.IO is mounted on the HTTP server root (strip `/api` from REST base URL). */
export function getSocketBaseUrl() {
  return String(apiBaseUrl || "").replace(/\/api\/?$/i, "");
}
