import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GoogleMap, InfoWindow, LoadScript, Marker } from "@react-google-maps/api";
import { io } from "socket.io-client";
import { getSocketBaseUrl } from "../services/socketBaseUrl";

const DEFAULT_CENTER = { lat: 11.5564, lng: 104.9282 };
const MAP_CONTAINER_STYLE = { width: "100%", height: 520 };

const WATCHER_ROLES = new Set(["Admin", "Owner", "Logistics"]);

const CUSTOMER_MARKER_ICON = "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
const DELIVERY_MARKER_ICON = "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";

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

export function TrackingCustomerLocationPage({ customers = [], token = "", userRole = "" }) {
  const { t, i18n } = useTranslation();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [deliveryByUserId, setDeliveryByUserId] = useState(() => new Map());
  const [socketStatus, setSocketStatus] = useState("idle");
  const [socketError, setSocketError] = useState("");
  const [activeKey, setActiveKey] = useState(null);

  const customerMarkers = useMemo(() => buildCustomerMarkers(customers), [customers]);
  const deliveryMarkers = useMemo(() => [...deliveryByUserId.values()], [deliveryByUserId]);
  const allMarkers = useMemo(() => [...customerMarkers, ...deliveryMarkers], [customerMarkers, deliveryMarkers]);

  const mapCenter = useMemo(() => {
    if (allMarkers.length === 0) return DEFAULT_CENTER;
    return { lat: allMarkers[0].lat, lng: allMarkers[0].lng };
  }, [allMarkers]);

  const canWatchDeliveries = Boolean(token) && WATCHER_ROLES.has(userRole);

  useEffect(() => {
    if (!canWatchDeliveries) {
      setDeliveryByUserId(new Map());
      setSocketStatus("idle");
      setSocketError("");
      return undefined;
    }

    const baseUrl = getSocketBaseUrl();
    if (!baseUrl) {
      setSocketError("Missing API base URL");
      setSocketStatus("error");
      return undefined;
    }

    setSocketStatus("connecting");
    const socket = io(baseUrl, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 12,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      setSocketStatus("connected");
      setSocketError("");
      socket.emit("subscribe:delivery-locations");
    });

    socket.on("disconnect", () => {
      setSocketStatus("disconnected");
    });

    socket.on("connect_error", (err) => {
      setSocketStatus("error");
      setSocketError(err?.message || "Socket error");
    });

    socket.on("delivery:location", (payload) => {
      if (!payload?.userId) return;
      const lat = Number(payload.latitude);
      const lng = Number(payload.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      setDeliveryByUserId((prev) => {
        const next = new Map(prev);
        next.set(String(payload.userId), {
          mapKey: `delivery:${payload.userId}`,
          kind: "delivery",
          userId: String(payload.userId),
          name: payload.name || payload.username || "Driver",
          phone: "",
          lat,
          lng,
          updatedAt: payload.updatedAt,
        });
        return next;
      });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [canWatchDeliveries, token]);

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

      {canWatchDeliveries ? (
        <div className="panel" style={{ marginBottom: 12, padding: "12px 16px" }}>
          <strong style={{ display: "block", marginBottom: 6 }}>{t("trackingCustomerLocation.liveDeliveryTitle")}</strong>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
            {socketStatus === "connected" && deliveryMarkers.length === 0
              ? t("trackingCustomerLocation.liveDeliveryWaiting")
              : null}
            {socketStatus === "connected" && deliveryMarkers.length > 0
              ? t("trackingCustomerLocation.liveDeliveryConnected", { count: deliveryMarkers.length })
              : null}
            {socketStatus === "connecting" ? t("trackingCustomerLocation.liveDeliveryConnecting") : null}
            {socketStatus === "disconnected" ? t("trackingCustomerLocation.liveDeliveryDisconnected") : null}
            {socketStatus === "error" ? t("trackingCustomerLocation.liveDeliveryError", { message: socketError }) : null}
            {socketStatus === "idle" ? t("trackingCustomerLocation.liveDeliveryIdle") : null}
          </p>
        </div>
      ) : null}

      {!apiKey ? (
        <div className="panel">
          <p className="text-muted" style={{ margin: 0 }}>
            {t("trackingCustomerLocation.noApiKey")}
          </p>
        </div>
      ) : allMarkers.length === 0 ? (
        <div className="panel">
          <p className="text-muted" style={{ margin: 0 }}>
            {t("trackingCustomerLocation.noMarkers")}
          </p>
        </div>
      ) : (
        <>
          <p className="text-muted" style={{ margin: "0 0 12px" }}>
            {t("trackingCustomerLocation.showing", {
              count: customerMarkers.length,
              deliveryCount: deliveryMarkers.length,
            })}
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
                {allMarkers.map((m) => (
                  <Marker
                    key={m.mapKey}
                    position={{ lat: m.lat, lng: m.lng }}
                    icon={m.kind === "delivery" ? DELIVERY_MARKER_ICON : CUSTOMER_MARKER_ICON}
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
                        {activeMarker.kind === "delivery"
                          ? t("trackingCustomerLocation.markerKindDelivery")
                          : t("trackingCustomerLocation.markerKindCustomer")}
                      </div>
                      <strong style={{ display: "block", marginBottom: 6 }}>{activeMarker.name || "—"}</strong>
                      {activeMarker.kind === "customer" && activeMarker.phone ? (
                        <div style={{ marginBottom: 8, fontSize: 13 }}>{activeMarker.phone}</div>
                      ) : null}
                      <div className="text-muted" style={{ margin: "2px 0 6px", fontSize: 11, lineHeight: 1.35 }}>
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
