import { useParams, useNavigate } from "react-router-dom";
import { Map as MapIcon, List, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useStaticRestaurantsByCity } from "@/hooks/useStaticData";
import { useLocale } from "@/hooks/useLocale";
import RestaurantCard from "@/components/RestaurantCard";
import MapView from "@/components/MapView";

export default function CityView() {
  const { city } = useParams<{ city: string }>();
  const navigate = useNavigate();
  const { $t } = useLocale();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const { data: apiRestaurants, isLoading: apiLoading } = trpc.restaurant.getByCity.useQuery(
    { city: city || "杭州" }, { enabled: !!city }
  );
  const { data: staticRestaurants, isLoading: staticLoading } = useStaticRestaurantsByCity(city || "杭州");

  const restaurants = apiRestaurants?.length ? apiRestaurants : staticRestaurants;
  const isLoading = apiLoading && staticLoading;
  if (!city) return null;

  const stats = {
    total: restaurants.length,
    threeStar: restaurants.filter((r: any) => r.award === "3-star").length,
    twoStar: restaurants.filter((r: any) => r.award === "2-star").length,
    oneStar: restaurants.filter((r: any) => r.award === "1-star").length,
    bibGourmand: restaurants.filter((r: any) => r.award === "bib-gourmand").length,
  };

  const starParts: string[] = [];
  if (stats.threeStar > 0) starParts.push(`${stats.threeStar}${$t("award.3-star")}`);
  if (stats.twoStar > 0) starParts.push(`${stats.twoStar}${$t("award.2-star")}`);
  if (stats.oneStar > 0) starParts.push(`${stats.oneStar}${$t("award.1-star")}`);
  if (stats.bibGourmand > 0) starParts.push(`${stats.bibGourmand}${$t("award.bib-gourmand")}`);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="relative h-[40vh] flex items-end overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundColor: "var(--bg-map)" }}>
          <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 50% 80%, rgba(200,145,58,0.2) 0%, transparent 60%)` }} />
        </div>
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 pb-8 max-w-7xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm mb-4 transition-colors hover:text-[var(--accent-gold)]" style={{ color: "var(--text-secondary)" }}>
            <ChevronLeft size={16} />{$t("city.back")}
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: "'Noto Serif SC', serif", color: "var(--text-primary)" }}>{city}</h1>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            {$t("city.stats", { total: stats.total, stars: starParts.length > 0 ? " · " + starParts.join(" · ") : "" })}
          </p>
          <div className="flex items-center rounded-lg p-0.5 w-fit" style={{ backgroundColor: "var(--bg-elevated)" }}>
            <button onClick={() => setViewMode("list")} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-all"
              style={{ backgroundColor: viewMode === "list" ? "var(--accent-gold)" : "transparent", color: viewMode === "list" ? "#0A0A0F" : "var(--text-secondary)" }}>
              <List size={12} />{$t("discover.sort.label")}
            </button>
            <button onClick={() => setViewMode("map")} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-all"
              style={{ backgroundColor: viewMode === "map" ? "var(--accent-gold)" : "transparent", color: viewMode === "map" ? "#0A0A0F" : "var(--text-secondary)" }}>
              <MapIcon size={12} />Map
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-2xl skeleton-pulse" style={{ backgroundColor: "var(--bg-card)" }}>
                <div className="w-[120px] h-[90px] rounded-xl" style={{ backgroundColor: "var(--bg-elevated)" }} />
                <div className="flex-1 space-y-2 py-2">
                  <div className="h-4 w-1/3 rounded" style={{ backgroundColor: "var(--bg-elevated)" }} />
                  <div className="h-3 w-1/4 rounded" style={{ backgroundColor: "var(--bg-elevated)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-1">
            {restaurants?.map((restaurant: any) => <RestaurantCard key={restaurant.id} restaurant={restaurant} variant="list" />)}
          </div>
        ) : (
          <MapView restaurants={restaurants as any} centerCity={city} />
        )}
      </div>
    </div>
  );
}
