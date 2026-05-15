import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Heart, Share2, Navigation, Phone, Globe, Clock, MapPin, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { useStaticRestaurantById } from "@/hooks/useStaticData";
import AwardBadge from "@/components/AwardBadge";
import LazyImage from "@/components/LazyImage";
import { buildNavigationUrl, type NavProvider } from "@/lib/geo";

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { $t } = useLocale();
  const utils = trpc.useUtils();
  const restaurantId = parseInt(id || "0");

  const { data: apiRestaurant, isLoading: apiLoading } = trpc.restaurant.getById.useQuery(
    { id: restaurantId },
    { enabled: restaurantId > 0 }
  );
  const { data: staticRestaurant, isLoading: staticLoading } = useStaticRestaurantById(restaurantId);

  const { data: favData } = trpc.favorite.check.useQuery(
    { restaurantId },
    { enabled: !!user && restaurantId > 0 }
  );
  const toggleFav = trpc.favorite.toggle.useMutation({
    onSuccess: () => {
      utils.favorite.check.invalidate({ restaurantId });
      utils.favorite.list.invalidate();
    },
  });

  const [showNavPicker, setShowNavPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [navProvider, setNavProvider] = useState<NavProvider>(() => {
    return (localStorage.getItem("nav_provider") as NavProvider) || "amap";
  });

  const restaurant = apiRestaurant || staticRestaurant;
  const isLoading = apiLoading && staticLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="w-8 h-8 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <p className="text-lg mb-4" style={{ color: "var(--text-secondary)" }}>{$t("detail.notFound")}</p>
        <button onClick={() => navigate("/")} className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: "var(--accent-gold)", color: "#0A0A0F" }}>
          {$t("detail.backHome")}
        </button>
      </div>
    );
  }

  const isFav = favData?.isFavorited ?? false;
  const priceSymbols = "¥".repeat(restaurant.priceRange);
  const priceText = "priceLabel" in restaurant && restaurant.priceLabel
    ? `${priceSymbols} · ${restaurant.priceLabel}`
    : priceSymbols;
  const galleryImages = "imageUrls" in restaurant && Array.isArray(restaurant.imageUrls) && restaurant.imageUrls.length
    ? restaurant.imageUrls
    : [restaurant.imageUrl || `https://picsum.photos/seed/${restaurant.id}/800/500.webp`];
  const heroImg = galleryImages[Math.min(selectedImage, galleryImages.length - 1)];
  const heroImages = galleryImages.length > 1
    ? [...galleryImages.slice(selectedImage), ...galleryImages.slice(0, selectedImage)].slice(0, 3)
    : [heroImg];

  const handleNavigate = () => {
    window.open(buildNavigationUrl(navProvider, restaurant), "_blank");
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: restaurant.name,
        text: `${restaurant.name} - ${restaurant.award}`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const selectNav = (provider: NavProvider) => {
    setNavProvider(provider);
    localStorage.setItem("nav_provider", provider);
    setShowNavPicker(false);
  };

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Hero Image */}
      <div className="relative h-[45vh] overflow-hidden" style={{ backgroundColor: "var(--bg-primary)" }}>
        {heroImages.length > 1 ? (
          <div className={`grid h-full w-full gap-1 p-1 ${heroImages.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {heroImages.map((image, index) => (
              <div key={`${image}-${index}`} className="relative min-w-0 overflow-hidden rounded-sm" style={{ backgroundColor: "var(--bg-elevated)" }}>
                <img
                  src={image}
                  alt={`${restaurant.name} ${index + 1}`}
                  className="h-full w-full object-contain"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>
        ) : (
          <LazyImage src={heroImg} alt={restaurant.name} seed={restaurant.name + restaurant.id} objectFit="contain" className="w-full h-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent z-10" />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
            <ChevronLeft size={20} color="#fff" />
          </button>
          <div className="flex gap-2">
            {user && (
              <button onClick={() => toggleFav.mutate({ restaurantId })}
                className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all hover:scale-110"
                style={{ backgroundColor: isFav ? "var(--accent-gold)" : "rgba(0,0,0,0.4)" }}>
                <Heart size={18} fill={isFav ? "#fff" : "none"} color="#fff" />
              </button>
            )}
            <button onClick={handleShare}
              className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
              <Share2 size={18} color="#fff" />
            </button>
          </div>
        </div>
      </div>

      {galleryImages.length > 1 && (
        <div className="max-w-3xl mx-auto px-4 -mt-12 relative z-20">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {galleryImages.map((image, index) => (
              <button
                key={image}
                onClick={() => setSelectedImage(index)}
                className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all"
                style={{
                  border: index === selectedImage ? "2px solid var(--accent-gold)" : "1px solid rgba(255,255,255,0.28)",
                }}
              >
                <img src={image} alt={`${restaurant.name} ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className={`max-w-3xl mx-auto px-4 relative z-10 ${galleryImages.length > 1 ? "-mt-4" : "-mt-20"}`}>
        <div className="rounded-3xl p-6 sm:p-8" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <div className="mb-4">
            <AwardBadge award={restaurant.award} size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: "'Noto Serif SC', serif", color: "var(--text-primary)" }}>
            {restaurant.name}
          </h1>
          {restaurant.nameEn && restaurant.nameEn !== restaurant.name && (
            <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>{restaurant.nameEn}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
              {restaurant.cuisine}
            </span>
            <span className="text-sm font-medium" style={{ color: "var(--text-gold)" }}>{priceText}</span>
          </div>

          {/* Navigation + Share + Favorite */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {/* Navigate button with provider indicator */}
            <div className="relative">
              <button onClick={() => setShowNavPicker(!showNavPicker)}
                className="w-full flex items-center justify-center gap-1 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                style={{ backgroundColor: "var(--accent-gold)", color: "#0A0A0F" }}>
                <Navigation size={14} />{$t("detail.navigate")}
              </button>
              <span className="absolute -top-1.5 -right-1.5 text-[9px] px-1 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: "#fff", color: "#0A0A0F" }}>
                {navProvider === "amap" ? "高德" : "百度"}
              </span>
            </div>
            <button onClick={handleShare}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all hover:scale-[1.02]"
              style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
              <Share2 size={16} />{$t("detail.share")}
            </button>
            {user && (
              <button onClick={() => toggleFav.mutate({ restaurantId })}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all hover:scale-[1.02]"
                style={{ backgroundColor: isFav ? "var(--accent-gold)" : "var(--bg-elevated)", color: isFav ? "#0A0A0F" : "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                <Heart size={16} fill={isFav ? "#0A0A0F" : "none"} />{isFav ? $t("detail.favorited") : $t("detail.favorite")}
              </button>
            )}
          </div>

          {/* Navigation Provider Picker */}
          {showNavPicker && (
            <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{$t("detail.selectNav")}</span>
                <button onClick={() => setShowNavPicker(false)}><X size={14} style={{ color: "var(--text-muted)" }} /></button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { selectNav("amap"); handleNavigate(); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: navProvider === "amap" ? "var(--accent-gold)" : "var(--bg-card)", color: navProvider === "amap" ? "#0A0A0F" : "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                  {$t("detail.amap")}
                </button>
                <button onClick={() => { selectNav("baidu"); handleNavigate(); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: navProvider === "baidu" ? "var(--accent-gold)" : "var(--bg-card)", color: navProvider === "baidu" ? "#0A0A0F" : "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                  {$t("detail.baidu")}
                </button>
              </div>
            </div>
          )}

          {/* Info Items */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
              <div>
                <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{$t("detail.address")}</div>
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {restaurant.city} · {restaurant.address}
                </div>
              </div>
            </div>

            {restaurant.openHours && (
              <div className="flex items-start gap-3">
                <Clock size={18} className="mt-0.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{$t("detail.hours")}</div>
                  <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{restaurant.openHours}</div>
                </div>
              </div>
            )}

            {restaurant.phone && (
              <div className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{$t("detail.phone")}</div>
                  <a href={`tel:${restaurant.phone}`} className="text-sm hover:text-[var(--accent-gold)] transition-colors" style={{ color: "var(--text-secondary)" }}>
                    {restaurant.phone}
                  </a>
                </div>
              </div>
            )}

            {restaurant.website && (
              <div className="flex items-start gap-3">
                <Globe size={18} className="mt-0.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{$t("detail.website")}</div>
                  <a href={restaurant.website} target="_blank" rel="noopener noreferrer"
                    className="text-sm hover:text-[var(--accent-gold)] transition-colors break-all" style={{ color: "var(--text-secondary)" }}>
                    {restaurant.website}
                  </a>
                </div>
              </div>
            )}
          </div>

          {restaurant.description && (
            <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{$t("detail.about")}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{restaurant.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
