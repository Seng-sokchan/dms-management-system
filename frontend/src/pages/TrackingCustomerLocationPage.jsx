import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GoogleMap, InfoWindow, LoadScript, Marker } from "@react-google-maps/api";
import { io } from "socket.io-client";
import { fetchOrderDeliveryLocation } from "../services/adminApi/deliveryLocations";
import { getSocketBaseUrl } from "../services/socketUrl";

const DEFAULT_CENTER = { lat: 11.5564, lng: 104.9282 };
const MAP_CONTAINER_STYLE = { width: "100%", height: 520 };
const TRACKABLE_STATUS = "Ready_For_Delivery";

const CUSTOMER_MARKER_ICON = "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
const DRIVER_MARKER_ICON = "https://maps.google.com/mapfiles/ms/icons/green-dot.png";

function parseCoord(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = parseFloat(String(value ?? "").trim());
  return Number.isFinite(n) ? n : NaN;
}

function buildCustomerMarkers(customers) {
  if (!Array.isArray(customers)) return [];
  const out = [];
  for (const c of customers) {
    const lat = parseCoord(c.latitude);
    const lng = parseCoord(c.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    out.push({
      mapKey: `customer:${c.id}`,
      kind: "customer",
      id: c.id,
      name: c.name ?? "",
      phone: c.phone ?? "",
      lat,
      lng,
      updatedAt: c.updatedAt ?? c.updated_at ?? null,
    });
  }
  return out;
}

function seedAgentOrders(orders) {
  if (!Array.isArray(orders)) return [];
  const byAgent = new Map();
  for (const row of orders) {
    if (row?.status !== TRACKABLE_STATUS || row?.deliveryAgentId == null) continue;
    const agentId = String(row.deliveryAgentId);
    if (byAgent.has(agentId)) continue;
    byAgent.set(agentId, {
      agentId,
      orderId: row.id,
      name: row.deliveryAgentName || "",
    });
  }
  return [...byAgent.values()];
}

export function TrackingCustomerLocationPage({ customers = [], orders = [], token = "" }) {
  const { t, i18n } = useTranslation();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [activeKey, setActiveKey] = useState(null);
  const [driversByAgent, setDriversByAgent] = useState({});
  const [socketState, setSocketState] = useState("idle");
  const socketRef = useRef(null);

  const customerMarkers = useMemo(() => buildCustomerMarkers(customers), [customers]);
  const activeAgents = useMemo(() => seedAgentOrders(orders), [orders]);

  const driverMarkers = useMemo(() => {
    return Object.values(driversByAgent)
      .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng))
      .map((d) => ({
        mapKey: `driver:${d.agentId}`,
        kind: "driver",
        id: d.agentId,
        name: d.name || "",
        lat: d.lat,
        lng: d.lng,
        updatedAt: d.updatedAt || null,
        accuracy: d.accuracy,
      }));
  }, [driversByAgent]);

  const allMarkers = useMemo(
    () => [...customerMarkers, ...driverMarkers],
    [customerMarkers, driverMarkers],
  );

  const mapCenter = useMemo(() => {
    if (allMarkers.length === 0) return DEFAULT_CENTER;
    return { lat: allMarkers[0].lat, lng: allMarkers[0].lng };
  }, [allMarkers]);

  const applyDriverPoint = useCallback((agentId, raw, fallbackName = "") => {
    const lat = parseCoord(raw?.latitude);
    const lng = parseCoord(raw?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const key = String(agentId);
    setDriversByAgent((prev) => ({
      ...prev,
      [key]: {
        agentId: key,
        name: raw?.name || raw?.username || prev[key]?.name || fallbackName || "",
        lat,
        lng,
        updatedAt: raw?.recordedAt || raw?.updatedAt || new Date().toISOString(),
        accuracy: raw?.accuracy != null ? Number(raw.accuracy) : undefined,
      },
    }));
  }, []);

  useEffect(() => {
    const accessToken = typeof token === "string" ? token.trim() : "";
    if (!accessToken || activeAgents.length === 0) return undefined;

    let cancelled = false;
    (async () => {
      await Promise.all(
        activeAgents.map(async (agent) => {
          try {
            const payload = await fetchOrderDeliveryLocation(accessToken, agent.orderId);
            if (cancelled) return;
            if (payload?.lastKnown) {
              applyDriverPoint(
                payload.deliveryAgentId ?? agent.agentId,
                payload.lastKnown,
                agent.name,
              );
            }
          } catch {
            /* seed is best-effort; live socket still updates */
          }
        }),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [activeAgents, applyDriverPoint, token]);

  useEffect(() => {
    const baseUrl = getSocketBaseUrl();
    const accessToken = typeof token === "string" ? token.trim() : "";
    if (!baseUrl || !accessToken) {
      setSocketState("idle");
      return undefined;
    }

    const socket = io(baseUrl, {
      auth: { token: accessToken },
      query: { token: accessToken },
      extraHeaders: { Authorization: `Bearer ${accessToken}` },
      transports: ["polling", "websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketState("connected");
      socket.emit("subscribe:delivery-locations");
    });
    socket.on("disconnect", () => setSocketState("disconnected"));
    socket.on("connect_error", () => setSocketState("error"));
    socket.on("delivery:location", (payload) => {
      const agentId = payload?.deliveryAgentId;
      if (agentId == null) return;
      applyDriverPoint(agentId, payload, payload?.name || "");
    });

    return () => {
      socketRef.current = null;
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [applyDriverPoint, token]);

  const onMapLoad = useCallback(
    (map) => {
      if (typeof window === "undefined" || !window.google?.maps || allMarkers.length === 0) return;
      const g = window.google.maps;
      if (allMarkers.length === 1) {
        const m = allMarkers[0];
        map.setCenter({ lat: m.lat, lng: m.lng });
        map.setZoom(11);
        return;
      }
      const bounds = new g.LatLngBounds();
      for (const m of allMarkers) bounds.extend({ lat: m.lat, lng: m.lng });
      const pad = { top: 120, right: 120, bottom: 120, left: 120 };
      map.fitBounds(bounds, pad);
      g.event.addListenerOnce(map, "idle", () => {
        const z = map.getZoom();
        if (z != null && z > 4) map.setZoom(z - 1);
      });
    },
    [allMarkers],
  );

  const activeMarker = activeKey != null ? allMarkers.find((m) => m.mapKey === activeKey) : null;

  const formatUpdated = useCallback(
    (iso) => {
      if (!iso) return "";
      try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat(i18n.language === "km" ? "km-KH" : "en-US", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(d);
      } catch {
        return String(iso);
      }
    },
    [i18n.language],
  );

  const connectionLabel =
    socketState === "connected"
      ? t("trackingCustomerLocation.live")
      : socketState === "error"
        ? t("trackingCustomerLocation.socketError")
        : socketState === "disconnected"
          ? t("trackingCustomerLocation.socketDisconnected")
          : t("trackingCustomerLocation.socketConnecting");

  const emptyMessage =
    customerMarkers.length === 0 && driverMarkers.length === 0
      ? t("trackingCustomerLocation.noMarkers")
      : null;

  return (
    <section className="admin-page">
      <header className="panel-header" style={{ marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>{t("trackingCustomerLocation.title")}</h2>
          <p className="text-muted" style={{ margin: "6px 0 0" }}>
            {t("trackingCustomerLocation.lead")}
          </p>
        </div>
      </header>

      {!apiKey ? (
        <div className="panel">
          <p className="text-muted" style={{ margin: 0 }}>
            {t("trackingCustomerLocation.noApiKey")}
          </p>
        </div>
      ) : emptyMessage ? (
        <div className="panel">
          <p className="text-muted" style={{ margin: 0 }}>
            {emptyMessage}
          </p>
        </div>
      ) : (
        <>
          <p className="text-muted" style={{ margin: "0 0 8px" }}>
            {t("trackingCustomerLocation.showing", {
              customers: customerMarkers.length,
              drivers: driverMarkers.length,
            })}
          </p>
          <p className="text-muted" style={{ margin: "0 0 12px", fontSize: 13 }}>
            {t("trackingCustomerLocation.connection")} · {connectionLabel}
          </p>
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <LoadScript googleMapsApiKey={apiKey}>
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={mapCenter}
                zoom={allMarkers.length === 1 ? 11 : 9}
                onLoad={onMapLoad}
                onClick={() => setActiveKey(null)}
                options={{ streetViewControl: false, mapTypeControl: true }}
              >
                {customerMarkers.map((m) => (
                  <Marker
                    key={m.mapKey}
                    position={{ lat: m.lat, lng: m.lng }}
                    icon={CUSTOMER_MARKER_ICON}
                    onClick={() => setActiveKey(m.mapKey)}
                  />
                ))}
                {driverMarkers.map((m) => (
                  <Marker
                    key={m.mapKey}
                    position={{ lat: m.lat, lng: m.lng }}
                    icon={DRIVER_MARKER_ICON}
                    onClick={() => setActiveKey(m.mapKey)}
                  />
                ))}
                {activeMarker ? (
                  <InfoWindow
                    position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
                    onCloseClick={() => setActiveKey(null)}
                  >
                    <div style={{ maxWidth: 240, padding: 4 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          color: "var(--text-muted, #6b7280)",
                          marginBottom: 4,
                        }}
                      >
                        {activeMarker.kind === "driver"
                          ? t("trackingCustomerLocation.markerKindDriver")
                          : t("trackingCustomerLocation.markerKindCustomer")}
                      </div>
                      <strong style={{ display: "block", marginBottom: 6 }}>
                        {activeMarker.name || "—"}
                      </strong>
                      {activeMarker.phone ? (
                        <div style={{ marginBottom: 8, fontSize: 13 }}>{activeMarker.phone}</div>
                      ) : null}
                      <div
                        className="text-muted"
                        style={{ margin: "2px 0 6px", fontSize: 11, lineHeight: 1.35 }}
                      >
                        {activeMarker.updatedAt
                          ? t("trackingCustomerLocation.lastSeen", {
                              time: formatUpdated(activeMarker.updatedAt),
                            })
                          : t("trackingCustomerLocation.lastSeenUnknown")}
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${encodeURIComponent(`${activeMarker.lat},${activeMarker.lng}`)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("trackingCustomerLocation.openMaps")}
                      </a>
                    </div>
                  </InfoWindow>
                ) : null}
              </GoogleMap>
            </LoadScript>
          </div>
        </>
      )}
    </section>
  );
}
