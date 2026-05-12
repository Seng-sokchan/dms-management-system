import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GoogleMap, InfoWindow, LoadScript, Marker } from "@react-google-maps/api";

const DEFAULT_CENTER = { lat: 11.5564, lng: 104.9282 };
const MAP_CONTAINER_STYLE = { width: "100%", height: 520 };

function parseCoord(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = parseFloat(String(value ?? "").trim());
  return Number.isFinite(n) ? n : NaN;
}

function buildMarkers(customers) {
  if (!Array.isArray(customers)) return [];
  const out = [];
  for (const c of customers) {
    const lat = parseCoord(c.latitude);
    const lng = parseCoord(c.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    out.push({
      id: c.id,
      name: c.name ?? "",
      phone: c.phone ?? "",
      lat,
      lng,
    });
  }
  return out;
}

export function TrackingCustomerLocationPage({ customers = [] }) {
  const { t } = useTranslation();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const markers = useMemo(() => buildMarkers(customers), [customers]);
  const [activeId, setActiveId] = useState(null);

  const mapCenter = useMemo(() => {
    if (markers.length === 0) return DEFAULT_CENTER;
    return { lat: markers[0].lat, lng: markers[0].lng };
  }, [markers]);

  const onMapLoad = useCallback(
    (map) => {
      if (typeof window === "undefined" || !window.google?.maps || markers.length === 0) return;
      const g = window.google.maps;
      if (markers.length === 1) {
        const m = markers[0];
        map.setCenter({ lat: m.lat, lng: m.lng });
        map.setZoom(11);
        return;
      }
      const bounds = new g.LatLngBounds();
      for (const m of markers) bounds.extend({ lat: m.lat, lng: m.lng });
      const pad = { top: 120, right: 120, bottom: 120, left: 120 };
      map.fitBounds(bounds, pad);
      g.event.addListenerOnce(map, "idle", () => {
        const z = map.getZoom();
        if (z != null && z > 4) map.setZoom(z - 1);
      });
    },
    [markers],
  );

  const activeMarker = activeId != null ? markers.find((m) => m.id === activeId) : null;

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
      ) : markers.length === 0 ? (
        <div className="panel">
          <p className="text-muted" style={{ margin: 0 }}>
            {t("trackingCustomerLocation.noMarkers")}
          </p>
        </div>
      ) : (
        <>
          <p className="text-muted" style={{ margin: "0 0 12px" }}>
            {t("trackingCustomerLocation.showing", { count: markers.length })}
          </p>
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <LoadScript googleMapsApiKey={apiKey}>
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={mapCenter}
                zoom={markers.length === 1 ? 11 : 9}
                onLoad={onMapLoad}
                onClick={() => setActiveId(null)}
                options={{ streetViewControl: false, mapTypeControl: true }}
              >
                {markers.map((m) => (
                  <Marker
                    key={String(m.id)}
                    position={{ lat: m.lat, lng: m.lng }}
                    onClick={() => setActiveId(m.id)}
                  />
                ))}
                {activeMarker ? (
                  <InfoWindow
                    position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
                    onCloseClick={() => setActiveId(null)}
                  >
                    <div style={{ maxWidth: 220, padding: 4 }}>
                      <strong style={{ display: "block", marginBottom: 6 }}>{activeMarker.name || "—"}</strong>
                      {activeMarker.phone ? (
                        <div style={{ marginBottom: 8, fontSize: 13 }}>{activeMarker.phone}</div>
                      ) : null}
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
