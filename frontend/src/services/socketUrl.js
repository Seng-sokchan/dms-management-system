/** Socket.IO attaches to the HTTP server root (strip `/v1` from REST base URL). */
export function getSocketBaseUrl() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/v1";
  return String(apiBase || "").replace(/\/v1\/?$/i, "");
}
