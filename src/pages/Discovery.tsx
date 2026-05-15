import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { List, Map, SlidersHorizontal, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import RestaurantCard from "@/components/RestaurantCard";
import MapView from "@/components/MapView";
import { useStaticFilteredRestaurants } from "@/hooks/useStaticData";
import { useLocale } from "@/hooks/useLocale";

const awards = [
  { value: "3-star", labelKey: "award.3-star" },
  { value: "2-star", labelKey: "award.2-star" },
  { value: "1-star", labelKey: "award.1-star" },
  { value: "bib-gourmand", labelKey: "award.bib-gourmand" },
  { value: "selected", labelKey: "award.selected" },
];

const cities = ["杭州", "上海", "广州", "北京", "成都", "深圳", "香港", "澳门", "台北"];

export default function Discovery() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const { $t } = useLocale();

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedAwards, setSelectedAwards] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sort, setSort] = useState<"name" | "priceAsc" | "priceDesc">("name");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { if (initialSearch) setSearchQuery(initialSearch); }, [initialSearch]);

  const { data: apiData, isLoading: apiLoading } = trpc.restaurant.list.useQuery({
    city: selectedCity || undefined, award: selectedAwards.length > 0 ? selectedAwards : undefined,
    search: searchQuery || undefined, sort, page, limit: 20,
  });
  const { data: staticData, isLoading: staticLoading } = useStaticFilteredRestaurants({
    city: selectedCity || undefined, award: selectedAwards.length > 0 ? selectedAwards : undefined, search: searchQuery || undefined,
  });

  const useStaticFallback = !apiData || apiData.restaurants.length === 0;
  const displayData = useMemo(() => {
    if (!useStaticFallback && apiData) return apiData;
    let sorted = [...staticData];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "priceAsc") sorted.sort((a, b) => a.priceRange - b.priceRange);
    else if (sort === "priceDesc") sorted.sort((a, b) => b.priceRange - a.priceRange);
    const pageSize = 20, total = sorted.length, totalPages = Math.ceil(total / pageSize);
    return { restaurants: sorted.slice((page - 1) * pageSize, page * pageSize), total, page, totalPages };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiData, staticData, sort, page]);

  const isLoading = apiLoading && staticLoading;
  const toggleAward = (award: string) => { setSelectedAwards(p => p.includes(award) ? p.filter(a => a !== award) : [...p, award]); setPage(1); };
  const hasActiveFilters = selectedCity || selectedAwards.length > 0 || searchQuery;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="sticky top-16 z-30 px-4 py-3" style={{ backgroundColor: "rgba(10,10,15,0.9)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto mb-3">
          <div className="flex items-center rounded-xl px-4 py-2.5" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
            <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder={$t("home.hero.placeholder")} className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-primary)" }} />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="ml-2"><X size={14} style={{ color: "var(--text-muted)" }} /></button>}
          </div>
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all"
              style={{ backgroundColor: showFilters ? "var(--accent-gold)" : "var(--bg-elevated)", color: showFilters ? "#0A0A0F" : "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
              <SlidersHorizontal size={12} />{$t("discover.filter")}
            </button>
            {hasActiveFilters && (
              <button onClick={() => { setSelectedCity(""); setSelectedAwards([]); setSearchQuery(""); setPage(1); }} className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap" style={{ color: "var(--error)" }}>
                {$t("discover.clearAll")}
              </button>
            )}
            {cities.map(city => (
              <button key={city} onClick={() => { setSelectedCity(selectedCity === city ? "" : city); setPage(1); }}
                className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all"
                style={{ backgroundColor: selectedCity === city ? "var(--accent-gold)" : "var(--bg-elevated)", color: selectedCity === city ? "#0A0A0F" : "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                {city}
              </button>
            ))}
          </div>
          {showFilters && (
            <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{$t("discover.award.label")}</div>
              <div className="flex flex-wrap gap-2">
                {awards.map(a => (
                  <button key={a.value} onClick={() => toggleAward(a.value)}
                    className="px-3 py-1.5 rounded-full text-xs transition-all"
                    style={{ backgroundColor: selectedAwards.includes(a.value) ? "var(--accent-gold)" : "var(--bg-elevated)", color: selectedAwards.includes(a.value) ? "#0A0A0F" : "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                    {$t(a.labelKey)}
                  </button>
                ))}
              </div>
              <div className="text-xs mt-3 mb-2" style={{ color: "var(--text-muted)" }}>{$t("discover.sort.label")}</div>
              <div className="flex gap-2">
                {(["name", "priceAsc", "priceDesc"] as const).map(s => (
                  <button key={s} onClick={() => setSort(s)}
                    className="px-3 py-1.5 rounded-full text-xs transition-all"
                    style={{ backgroundColor: sort === s ? "var(--accent-gold)" : "var(--bg-elevated)", color: sort === s ? "#0A0A0F" : "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                    {$t(`discover.sort.${s}`)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="max-w-7xl mx-auto mt-2 flex justify-end">
          <div className="flex items-center rounded-lg p-0.5" style={{ backgroundColor: "var(--bg-elevated)" }}>
            <button onClick={() => setViewMode("list")} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-all"
              style={{ backgroundColor: viewMode === "list" ? "var(--accent-gold)" : "transparent", color: viewMode === "list" ? "#0A0A0F" : "var(--text-secondary)" }}>
              <List size={12} />{$t("discover.sort.label")}
            </button>
            <button onClick={() => setViewMode("map")} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-all"
              style={{ backgroundColor: viewMode === "map" ? "var(--accent-gold)" : "transparent", color: viewMode === "map" ? "#0A0A0F" : "var(--text-secondary)" }}>
              <Map size={12} />Map
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-card)" }}>
                <div className="w-[120px] h-[90px] rounded-xl skeleton-pulse" style={{ backgroundColor: "var(--bg-elevated)" }} />
                <div className="flex-1 space-y-2 py-2">
                  <div className="h-4 w-1/3 rounded skeleton-pulse" style={{ backgroundColor: "var(--bg-elevated)" }} />
                  <div className="h-3 w-1/4 rounded skeleton-pulse" style={{ backgroundColor: "var(--bg-elevated)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === "list" ? (
          <>
            <div className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
              {$t("discover.total", { count: displayData?.total || 0 })}
            </div>
            <div className="space-y-1">
              {displayData?.restaurants?.map(r => <RestaurantCard key={r.id} restaurant={r as any} variant="list" />)}
            </div>
            {displayData && displayData.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-lg text-sm disabled:opacity-30" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)" }}>{$t("discover.prev")}</button>
                <span className="px-4 py-2 text-sm" style={{ color: "var(--text-secondary)" }}>{page} / {displayData.totalPages}</span>
                <button onClick={() => setPage(Math.min(displayData.totalPages, page + 1))} disabled={page >= displayData.totalPages}
                  className="px-4 py-2 rounded-lg text-sm disabled:opacity-30" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)" }}>{$t("discover.next")}</button>
              </div>
            )}
          </>
        ) : (
          <MapView restaurants={(displayData?.restaurants || []) as any} />
        )}
      </div>
    </div>
  );
}
