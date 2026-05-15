import { useCallback, useEffect, useMemo, useState } from "react";
import { Crosshair, LocateFixed, Navigation, RefreshCw } from "lucide-react";
import AwardBadge from "@/components/AwardBadge";
import MapView, { type MapRestaurant } from "@/components/MapView";
import { useStaticRestaurants, type StaticRestaurant } from "@/hooks/useStaticData";
import { useLocale } from "@/hooks/useLocale";
import { buildNavigationUrl } from "@/lib/geo";
import {
  findNearestCity,
  getNearbyRestaurants,
  GUIDE_CITY_CENTERS,
  type Coordinates,
  type NearbyRestaurant,
} from "@/lib/nearby";

type LocationStatus = "locating" | "ready" | "denied" | "unsupported";

const FALLBACK_CITY = "杭州";

export default function MapPage() {
  const { $t } = useLocale();
  const { data: restaurants, isLoading } = useStaticRestaurants();
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<LocationStatus>("locating");
  const [selectedRestaurant, setSelectedRestaurant] = useState<MapRestaurant | null>(null);

  const requestLocation = useCallback((showPending = true) => {
    if (!navigator.geolocation) {
      setStatus("unsupported");
      return;
    }

    if (showPending) setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setStatus("ready");
      },
      () => {
        setUserLocation(null);
        setStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      queueMicrotask(() => setStatus("unsupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setStatus("ready");
      },
      () => {
        setUserLocation(null);
        setStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  const nearestCity = useMemo(() => {
    if (!userLocation) return null;
    return findNearestCity(userLocation);
  }, [userLocation]);

  const activeCity = nearestCity?.name || FALLBACK_CITY;
  const fallbackLocation = GUIDE_CITY_CENTERS[FALLBACK_CITY];
  const mapLocation = userLocation || fallbackLocation;
  const nearbyRestaurants = useMemo<NearbyRestaurant<StaticRestaurant>[]>(() => {
    return getNearbyRestaurants({
      restaurants,
      userLocation: mapLocation,
      city: activeCity,
      limit: 60,
    });
  }, [activeCity, mapLocation, restaurants]);

  const topRestaurants = nearbyRestaurants.slice(0, 12);
  const locationMessage = status === "ready" && nearestCity
    ? $t("map.cityDetected", { city: nearestCity.name })
    : status === "locating"
      ? $t("map.locating")
      : $t("map.locationFallback", { city: FALLBACK_CITY });

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden" style={{ backgroundColor: "var(--bg-primary)" }}>
      <MapView
        restaurants={nearbyRestaurants}
        centerCity={activeCity}
        userCity={activeCity}
        userLocation={userLocation}
        height="calc(100vh - 64px)"
        className="rounded-none border-0"
        selectedRestaurant={selectedRestaurant}
        onRestaurantSelect={setSelectedRestaurant}
        onRestaurantClose={() => setSelectedRestaurant(null)}
      />

      <section className="absolute left-0 right-0 top-0 z-[1000] px-4 pt-4 md:left-4 md:right-auto md:w-[380px]">
        <div className="overflow-hidden rounded-2xl border shadow-2xl" style={{ backgroundColor: "rgba(10,10,15,0.9)", borderColor: "var(--border-subtle)", backdropFilter: "blur(14px)" }}>
          <div className="border-b px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--accent-gold)" }}>
                  <Crosshair size={14} />
                  <span>{locationMessage}</span>
                </div>
                <h1 className="mt-1 truncate text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                  {$t("map.nearbyTitle")}
                </h1>
              </div>
              <button
                onClick={() => requestLocation()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-elevated)]"
                title={$t("map.relocate")}
              >
                {status === "locating" ? (
                  <RefreshCw size={18} className="animate-spin" style={{ color: "var(--accent-gold)" }} />
                ) : (
                  <LocateFixed size={18} style={{ color: "var(--accent-gold)" }} />
                )}
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {$t("map.count", { count: nearbyRestaurants.length, city: activeCity })}
            </p>
          </div>

          <div className="max-h-[42vh] overflow-y-auto md:max-h-[calc(100vh-220px)]">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 rounded-xl skeleton-pulse" style={{ backgroundColor: "var(--bg-elevated)" }} />
                ))}
              </div>
            ) : topRestaurants.length > 0 ? (
              <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {topRestaurants.map((restaurant) => (
                  <article key={restaurant.id} className="px-4 py-3 transition-colors hover:bg-[var(--bg-elevated)]">
                    <button onClick={() => setSelectedRestaurant(restaurant)} className="w-full text-left">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            {restaurant.name}
                          </h2>
                          <div className="mt-1">
                            <AwardBadge award={restaurant.award} size="sm" />
                          </div>
                        </div>
                        <span className="shrink-0 text-xs font-medium" style={{ color: "var(--accent-gold)" }}>
                          {restaurant.distanceKm.toFixed(1)} km
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                        {restaurant.cuisine} · {restaurant.address}
                      </p>
                    </button>
                    <button
                      onClick={() => {
                        const provider = localStorage.getItem("nav_provider") || "amap";
                        window.open(buildNavigationUrl(provider === "baidu" ? "baidu" : "amap", restaurant), "_blank");
                      }}
                      className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-[var(--bg-card)]"
                      style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
                    >
                      <Navigation size={12} />
                      {$t("detail.navigate")}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                {$t("map.empty")}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
