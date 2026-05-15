import { useNavigate } from "react-router-dom";
import { Search, ChevronDown, Award, MapPin, Utensils } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useStaticRestaurants, useStaticCities } from "@/hooks/useStaticData";
import { GradientPlaceholder, getCityColor } from "@/components/GradientBg";
import LazyImage from "@/components/LazyImage";
import RestaurantCard from "@/components/RestaurantCard";
import { useLocale } from "@/hooks/useLocale";

const cityImages: Record<string, string> = {
  "杭州": "/hero-hangzhou.jpg", "上海": "/city-shanghai.jpg",
  "北京": "/city-beijing.jpg", "广州": "/city-guangzhou.jpg",
  "成都": "/city-chengdu.jpg", "香港": "/city-hongkong.jpg",
};

export default function Home() {
  const navigate = useNavigate();
  const { $t, locale } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: apiFeatured } = trpc.restaurant.list.useQuery({
    award: ["3-star", "2-star"], limit: 6, sort: "name",
  });
  const { data: staticRestaurants } = useStaticRestaurants();
  const { cities: staticCities } = useStaticCities();

  const featuredRestaurants = apiFeatured?.restaurants?.length ? apiFeatured.restaurants :
    staticRestaurants.filter(r => ["3-star", "2-star"].includes(r.award)).slice(0, 6);
  const topCities = staticCities.slice(0, 9);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/discover?search=${encodeURIComponent(searchQuery)}`);
  };

  const heroTitle = locale === "zh" ? "发现卓越" : "Discover Excellence";
  const heroSubtitle = locale === "zh"
    ? "探索中国顶级米其林星级餐厅与必比登推介"
    : "Explore top MICHELIN-starred & Bib Gourmand restaurants";
  const heroTag = locale === "zh" ? "杭州 · 西子湖畔" : "Hangzhou · West Lake";

  const stats = [
    { icon: Award, label: $t("nav.city"), value: staticCities.length || 23 },
    { icon: MapPin, label: $t("nav.discover"), value: staticRestaurants.length || 1181 },
    { icon: Utensils, label: locale === "zh" ? "星级餐厅" : "Starred", value: staticRestaurants.filter(r => r.award !== "selected" && r.award !== "bib-gourmand").length || 300 },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <LazyImage src="/hero-hangzhou.jpg" alt="Hangzhou" seed="hangzhou-hero" className="w-full h-full" />
          <div className="absolute inset-0 bg-black/50 z-10" />
        </div>
        <div className="absolute inset-0 z-10 opacity-30">
          {topCities.slice(0, 6).map((city, i) => (
            <div key={city.city} className="absolute" style={{ left: `${18 + (i * 13)}%`, top: `${25 + (i % 3) * 18}%` }}>
              <div className="relative">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCityColor(city.city) }} />
                <div className="absolute -inset-1 rounded-full pulse-ring" style={{ border: `1.5px solid ${getCityColor(city.city)}` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-20 text-center px-4 max-w-2xl mx-auto">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs mb-4" style={{ backgroundColor: "rgba(200,145,58,0.3)", color: "var(--accent-gold)", border: "1px solid rgba(200,145,58,0.5)" }}>
              {heroTag}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: "'Noto Serif SC', serif", color: "var(--text-primary)" }}>
            {heroTitle}
          </h1>
          <p className="text-base sm:text-lg mb-8" style={{ color: "var(--text-secondary)" }}>
            {heroSubtitle}
          </p>

          <form onSubmit={handleSearch} className="relative max-w-lg mx-auto mb-8">
            <div className="flex items-center rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(30,30,38,0.8)", backdropFilter: "blur(12px)", border: "1px solid var(--border-subtle)" }}>
              <MapPin size={18} className="ml-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={$t("home.hero.placeholder")} className="flex-1 bg-transparent px-3 py-4 text-sm outline-none"
                style={{ color: "var(--text-primary)" }} />
              <button type="submit" className="px-5 py-4 transition-colors hover:opacity-80" style={{ backgroundColor: "var(--accent-gold)" }}>
                <Search size={18} color="#0A0A0F" />
              </button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {topCities.slice(0, 6).map((c) => (
              <button key={c.city} onClick={() => navigate(`/city/${c.city}`)}
                className="px-4 py-2 rounded-full text-sm transition-all hover:scale-105"
                style={{ backgroundColor: "rgba(30,30,38,0.6)", backdropFilter: "blur(8px)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                {c.city}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-8 sm:gap-12">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon size={20} className="mx-auto mb-1" style={{ color: "var(--accent-gold)" }} />
                <div className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{stat.value}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <ChevronDown size={24} style={{ color: "var(--text-muted)" }} />
        </div>
      </section>

      {/* Cities */}
      <section className="py-16 px-4" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ fontFamily: "'Noto Serif SC', serif", color: "var(--text-primary)" }}>
            {$t("home.cities.title")}
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {topCities.map((c) => (
              <button key={c.city} onClick={() => navigate(`/city/${c.city}`)}
                className="group relative flex-shrink-0 w-[160px] h-[100px] rounded-xl overflow-hidden snap-start transition-all hover:scale-105 hover:shadow-lg">
                {cityImages[c.city] ? (
                  <LazyImage src={cityImages[c.city]} alt={c.city} seed={c.city} className="w-full h-full" />
                ) : (
                  <GradientPlaceholder seed={c.city} className="w-full h-full" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
                <div className="absolute bottom-2 left-2 z-20 text-left">
                  <span className="text-sm font-medium text-white">{c.city}</span>
                  <span className="block text-xs text-white/60">{c.count}{locale === "zh" ? "家餐厅" : " restaurants"}</span>
                </div>
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-20" style={{ border: "2px solid var(--accent-gold)" }} />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-16 px-4" style={{ backgroundColor: "var(--bg-card)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif SC', serif", color: "var(--text-primary)" }}>
              {$t("home.featured.title")}
            </h2>
            <button onClick={() => navigate("/discover")} className="text-sm transition-colors hover:text-[var(--accent-gold-light)]" style={{ color: "var(--accent-gold)" }}>
              {$t("home.featured.viewAll")} →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRestaurants?.map((restaurant) => (
              <div key={restaurant.id} className="gold-gradient-border">
                <div className="gold-gradient-border-inner">
                  <RestaurantCard restaurant={restaurant as any} variant="grid" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="relative py-20 px-4 overflow-hidden" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, var(--accent-gold) 0%, transparent 60%)` }} />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Noto Serif SC', serif", color: "var(--text-primary)" }}>
            {$t("home.about.title")}
          </h2>
          <p className="text-base leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
            {$t("home.about.desc")}
          </p>
          <button onClick={() => navigate("/discover")}
            className="px-6 py-3 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{ color: "var(--accent-gold)", border: "1px solid var(--accent-gold)" }}>
            {$t("home.about.cta")}
          </button>
        </div>
      </section>
    </div>
  );
}
