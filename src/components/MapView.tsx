import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, MapPin, Navigation, X } from "lucide-react";
import AwardBadge from "./AwardBadge";
import { useLocale } from "@/hooks/useLocale";
import { buildNavigationUrl, getAmapMarkerPosition } from "@/lib/geo";
import { GUIDE_CITY_CENTERS, type Coordinates } from "@/lib/nearby";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapRestaurant {
  id: number;
  name: string;
  nameEn?: string | null;
  city: string;
  address: string;
  latitude: string | number;
  longitude: string | number;
  amapLocation?: string | null;
  award: string;
  cuisine: string;
  priceRange: number;
  priceLabel?: string;
  distanceKm?: number;
  description?: string | null;
}

interface Props {
  restaurants: MapRestaurant[];
  centerCity?: string;
  userLocation?: Coordinates | null;
  userCity?: string;
  height?: string;
  className?: string;
  selectedRestaurant?: MapRestaurant | null;
  onRestaurantSelect?: (restaurant: MapRestaurant) => void;
  onRestaurantClose?: () => void;
}

function getAwardColor(award: string): string {
  switch (award) {
    case "3-star": return "#DC2626";
    case "2-star": return "#EF4444";
    case "1-star": return "#F87171";
    case "bib-gourmand": return "#E8903A";
    default: return "#6B665E";
  }
}

export default function MapView({
  restaurants,
  centerCity,
  userLocation,
  userCity,
  height,
  className,
  selectedRestaurant,
  onRestaurantSelect,
  onRestaurantClose,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const navigate = useNavigate();
  const { $t } = useLocale();
  const [internalSelectedRestaurant, setInternalSelectedRestaurant] = useState<MapRestaurant | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const activeSelectedRestaurant = selectedRestaurant === undefined ? internalSelectedRestaurant : selectedRestaurant;
  const priceSymbols = activeSelectedRestaurant ? "¥".repeat(activeSelectedRestaurant.priceRange) : "";
  const priceText = activeSelectedRestaurant?.priceLabel ? `${priceSymbols} · ${activeSelectedRestaurant.priceLabel}` : priceSymbols;

  const defaultCenter: [number, number] = centerCity && GUIDE_CITY_CENTERS[centerCity]
    ? [GUIDE_CITY_CENTERS[centerCity].latitude, GUIDE_CITY_CENTERS[centerCity].longitude]
    : [30.2741, 120.1551]; // Hangzhou center

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    try {
      const map = L.map(mapContainer.current, {
        center: defaultCenter,
        zoom: centerCity ? 12 : 5,
        zoomControl: false,
        attributionControl: false,
      });

      // Amap tiles (dark theme) - 高德暗色瓦片
      L.tileLayer(
        "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
        {
          subdomains: "1234",
          maxZoom: 18,
          minZoom: 3,
        }
      ).addTo(map);

      // Add zoom control to bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Marker layer group
      markersLayer.current = L.layerGroup().addTo(map);

      mapInstance.current = map;
      setMapLoaded(true);
    } catch {
      setLoadError(true);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markersLayer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when restaurants change
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current || !markersLayer.current) return;

    // Clear old markers
    markersLayer.current.clearLayers();

    const validRestaurants = restaurants.filter((r) => {
      const lng = typeof r.longitude === "string" ? parseFloat(r.longitude) : r.longitude;
      const lat = typeof r.latitude === "string" ? parseFloat(r.latitude) : r.latitude;
      return !isNaN(lng) && !isNaN(lat) && lng > 73 && lng < 136 && lat > 3 && lat < 54;
    });

    if (validRestaurants.length === 0 && !userLocation) return;

    const bounds = L.latLngBounds([]);

    if (userLocation) {
      const markerCity = userCity || centerCity || "";
      const [userMapLat, userMapLng] = getAmapMarkerPosition(markerCity, userLocation.latitude, userLocation.longitude);
      const userMarker = L.circleMarker([userMapLat, userMapLng], {
        radius: 9,
        fillColor: "#2D7FF9",
        color: "#FFFFFF",
        weight: 3,
        opacity: 1,
        fillOpacity: 0.95,
      });

      userMarker.bindPopup(
        `<div style="font-weight:600;font-size:13px;color:#F5F0E8;padding:2px 4px;">${$t("map.yourLocation")}</div>`,
        { closeButton: false, className: "dark-popup", offset: [0, -5] },
      );
      userMarker.addTo(markersLayer.current);
      bounds.extend([userMapLat, userMapLng]);
    }

    validRestaurants.forEach((restaurant) => {
      const lng = typeof restaurant.longitude === "string" ? parseFloat(restaurant.longitude) : restaurant.longitude;
      const lat = typeof restaurant.latitude === "string" ? parseFloat(restaurant.latitude) : restaurant.latitude;
      const [amapLng, amapLat] = (restaurant.amapLocation || "").split(",").map(Number);
      const [mapLat, mapLng] = Number.isFinite(amapLat) && Number.isFinite(amapLng)
        ? [amapLat, amapLng]
        : getAmapMarkerPosition(restaurant.city, lat, lng);
      const color = getAwardColor(restaurant.award);

      // Custom colored circle marker
      const marker = L.circleMarker([mapLat, mapLng], {
        radius: 8,
        fillColor: color,
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      });

      // Popup content
      const popupContent = `
        <div style="min-width:160px;padding:4px;">
          <div style="font-weight:600;font-size:13px;color:#F5F0E8;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${restaurant.name}
          </div>
          <div style="font-size:11px;color:#A39E95;">
            ${restaurant.cuisine} · ${restaurant.city}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: "dark-popup",
        offset: [0, -5],
      });

      marker.on("click", () => {
        if (onRestaurantSelect) onRestaurantSelect(restaurant);
        else setInternalSelectedRestaurant(restaurant);
      });
      marker.on("mouseover", () => marker.openPopup());

      marker.addTo(markersLayer.current!);
      bounds.extend([mapLat, mapLng]);
    });

    // Fit bounds with padding
    if (validRestaurants.length > 1 || userLocation) {
      mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else if (validRestaurants.length === 1) {
      const r = validRestaurants[0];
      const lng = typeof r.longitude === "string" ? parseFloat(r.longitude) : r.longitude;
      const lat = typeof r.latitude === "string" ? parseFloat(r.latitude) : r.latitude;
      const [amapLng, amapLat] = (r.amapLocation || "").split(",").map(Number);
      const [mapLat, mapLng] = Number.isFinite(amapLat) && Number.isFinite(amapLng)
        ? [amapLat, amapLng]
        : getAmapMarkerPosition(r.city, lat, lng);
      mapInstance.current.setView([mapLat, mapLng], 14);
    }
  }, [centerCity, mapLoaded, onRestaurantSelect, restaurants, userCity, userLocation, $t]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border ${className || ""}`}
      style={{ height: height || "calc(100vh - 280px)", minHeight: "400px", borderColor: "var(--border-subtle)" }}
    >
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading state */}
      {!mapLoaded && !loadError && (
        <div className="absolute inset-0 z-[900] flex items-center justify-center" style={{ backgroundColor: "#0d0d1a" }}>
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{$t("common.mapLoading")}</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div className="absolute inset-0 z-[900] flex flex-col items-center justify-center" style={{ backgroundColor: "#0d0d1a" }}>
          <MapPin size={32} style={{ color: "var(--text-muted)" }} className="mb-2" />
          <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>{$t("common.mapError")}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{$t("common.networkError")}</p>
        </div>
      )}

      {/* Restaurant count badge */}
      {mapLoaded && (
        <div className="absolute left-3 top-3 z-[900] px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: "rgba(10,10,15,0.8)", backdropFilter: "blur(8px)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}>
          <MapPin size={12} className="inline mr-1" style={{ color: "var(--accent-gold)" }} />
          {restaurants.length} {$t("discover.total", { count: restaurants.length }).replace(/\d+\s*/, "")}
        </div>
      )}

      {/* Bottom Sheet */}
      {activeSelectedRestaurant && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeSelectedRestaurant.name}
          className="absolute bottom-5 left-4 right-4 z-[1200] max-w-[440px] rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 md:left-auto md:right-5"
          style={{ backgroundColor: "rgba(20,20,25,0.96)", border: "1px solid var(--border-subtle)", backdropFilter: "blur(16px)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
                {activeSelectedRestaurant.name}
              </h3>
              {activeSelectedRestaurant.nameEn && activeSelectedRestaurant.nameEn !== activeSelectedRestaurant.name && (
                <p className="mt-1 truncate text-xs" style={{ color: "var(--text-muted)" }}>{activeSelectedRestaurant.nameEn}</p>
              )}
              <div className="mt-2">
                <AwardBadge award={activeSelectedRestaurant.award} size="sm" />
              </div>
            </div>
            <button
              onClick={() => {
                if (onRestaurantClose) onRestaurantClose();
                else setInternalSelectedRestaurant(null);
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-card)]"
              aria-label="Close"
            >
              <X size={16} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>

          <div className="mt-4 space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" style={{ color: "var(--accent-gold)" }} />
              <span className="leading-relaxed">{activeSelectedRestaurant.address}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span>{activeSelectedRestaurant.cuisine}</span>
              <span style={{ color: "var(--border-medium)" }}>·</span>
              <span>{activeSelectedRestaurant.city}</span>
              {priceText && (
                <>
                  <span style={{ color: "var(--border-medium)" }}>·</span>
                  <span style={{ color: "var(--text-gold)" }}>{priceText}</span>
                </>
              )}
              {typeof activeSelectedRestaurant.distanceKm === "number" && (
                <>
                  <span style={{ color: "var(--border-medium)" }}>·</span>
                  <span style={{ color: "var(--accent-gold)" }}>{activeSelectedRestaurant.distanceKm.toFixed(1)} km</span>
                </>
              )}
            </div>
            {activeSelectedRestaurant.description && (
              <p className="line-clamp-3 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {activeSelectedRestaurant.description}
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/restaurant/${activeSelectedRestaurant.id}`)}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium"
              style={{ backgroundColor: "var(--accent-gold)", color: "#0A0A0F" }}
            >
              <ExternalLink size={13} />
              {$t("detail.viewDetails")}
            </button>
            <button
              onClick={() => {
                const provider = localStorage.getItem("nav_provider") || "amap";
                window.open(buildNavigationUrl(provider === "baidu" ? "baidu" : "amap", activeSelectedRestaurant), "_blank");
              }}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <Navigation size={13} />
              {$t("detail.navigate")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
