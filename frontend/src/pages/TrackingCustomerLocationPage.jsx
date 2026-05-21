import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GoogleMap, InfoWindow, LoadScript, Marker } from "@react-google-maps/api";

const DEFAULT_CENTER = { lat: 11.5564, lng: 104.9282 };
const MAP_CONTAINER_STYLE = { width: "100%", height: 520 };

const CUSTOMER_MARKER_ICON = "https://maps.google.com/mapfiles/ms/icons/red-dot.png";

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

export function TrackingCustomerLocationPage({ customers = [] }) {
  const { t, i18n } = useTranslation();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [activeKey, setActiveKey] = useState(null);

  const customerMarkers = useMemo(() => buildCustomerMarkers(customers), [customers]);

  const mapCenter = useMemo(() => {
    if (customerMarkers.length === 0) return DEFAULT_CENTER;
    return { lat: customerMarkers[0].lat, lng: customerMarkers[0].lng };
  }, [customerMarkers]);

  const onMapLoad = useCallback(
    (map) => {
      if (typeof window === "undefined" || !window.google?.maps || customerMarkers.length === 0) return;
      const g = window.google.maps;
      if (customerMarkers.length === 1) {
        const m = customerMarkers[0];
        map.setCenter({ lat: m.lat, lng: m.lng });
        map.setZoom(11);
        return;
      }
      const bounds = new g.LatLngBounds();
      for (const m of customerMarkers) bounds.extend({ lat: m.lat, lng: m.lng });
      const pad = { top: 120, right: 120, bottom: 120, left: 120 };
      map.fitBounds(bounds, pad);
      g.event.addListenerOnce(map, "idle", () => {
        const z = map.getZoom();
        if (z != null && z > 4) map.setZoom(z - 1);
      });
    },
    [customerMarkers],
  );

  const activeMarker = activeKey != null ? customerMarkers.find((m) => m.mapKey === activeKey) : null;

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

      {!apiKey ? (
        <div className="panel">
          <p className="text-muted" style={{ margin: 0 }}>
            {t("trackingCustomerLocation.noApiKey")}
          </p>
        </div>
      ) : customerMarkers.length === 0 ? (
        <div className="panel">
          <p className="text-muted" style={{ margin: 0 }}>
            {t("trackingCustomerLocation.noMarkers")}
          </p>
        </div>
      ) : (
        <>
          <p className="text-muted" style={{ margin: "0 0 12px" }}>
            {t("trackingCustomerLocation.showing", { count: customerMarkers.length })}
          </p>
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <LoadScript googleMapsApiKey={apiKey}>
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={mapCenter}
                zoom={customerMarkers.length === 1 ? 11 : 9}
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
                        {t("trackingCustomerLocation.markerKindCustomer")}
                      </div>
                      <strong style={{ display: "block", marginBottom: 6 }}>{activeMarker.name || "—"}</strong>
                      {activeMarker.phone ? (
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
