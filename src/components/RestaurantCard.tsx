import { useNavigate } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import AwardBadge from "./AwardBadge";
import { GradientPlaceholder } from "./GradientBg";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  restaurant: {
    id: number;
    name: string;
    nameEn: string | null;
    city: string;
    district: string | null;
    address: string;
    award: string;
    cuisine: string;
    priceRange: number;
    priceLabel?: string;
    imageUrl?: string | null;
    rating: string | null;
    reviewCount: number | null;
  };
  variant?: "list" | "grid";
  showFavorite?: boolean;
}

// Generate fast image URL with WebP and small size for card
function getImageUrl(seed: number, width: number, height: number): string {
  return `https://picsum.photos/seed/${seed}/${width}/${height}.webp`;
}

export default function RestaurantCard({ restaurant, variant = "list", showFavorite = true }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: favData } = trpc.favorite.check.useQuery(
    { restaurantId: restaurant.id },
    { enabled: !!user }
  );
  const toggleFav = trpc.favorite.toggle.useMutation({
    onSuccess: () => utils.favorite.check.invalidate({ restaurantId: restaurant.id }),
  });

  const isFav = favData?.isFavorited ?? false;
  const priceSymbols = "¥".repeat(restaurant.priceRange);
  const priceText = restaurant.priceLabel ? `${priceSymbols} · ${restaurant.priceLabel}` : priceSymbols;
  const handleClick = () => navigate(`/restaurant/${restaurant.id}`);
  const cardImageUrl = restaurant.imageUrl || getImageUrl(restaurant.id, 400, 300);
  const listImageUrl = restaurant.imageUrl || getImageUrl(restaurant.id, 240, 180);

  if (variant === "grid") {
    return (
      <div onClick={handleClick} className="group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* Fast gradient placeholder */}
          <div className="absolute inset-0 z-0">
            <GradientPlaceholder seed={restaurant.name + restaurant.id} className="w-full h-full" />
          </div>
          {/* External image - lazy loaded, fades in when ready */}
          <LazyImage
            src={cardImageUrl}
            alt={restaurant.name}
            className="absolute inset-0 z-10 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-20" />
          {showFavorite && user && (
            <button onClick={(e) => { e.stopPropagation(); toggleFav.mutate({ restaurantId: restaurant.id }); }}
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-30"
              style={{ backgroundColor: isFav ? "var(--accent-gold)" : "rgba(0,0,0,0.4)" }}>
              <Star size={16} fill={isFav ? "#fff" : "none"} color={isFav ? "#fff" : "var(--text-primary)"} />
            </button>
          )}
          <div className="absolute bottom-3 left-3 z-30">
            <AwardBadge award={restaurant.award} size="sm" />
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-base font-semibold mb-1 truncate" style={{ color: "var(--text-primary)" }}>{restaurant.name}</h3>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span>{restaurant.cuisine}</span>
            <span style={{ color: "var(--border-medium)" }}>·</span>
            <span style={{ color: "var(--text-gold)" }}>{priceText}</span>
          </div>
          <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <MapPin size={10} />
            <span className="truncate">{restaurant.city}{restaurant.district ? ` · ${restaurant.district}` : ""}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={handleClick}
      className="group cursor-pointer flex gap-4 p-3 rounded-2xl transition-all duration-200 hover:bg-[var(--bg-card)]"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="relative w-[120px] h-[90px] rounded-xl overflow-hidden flex-shrink-0">
        {/* Fast gradient placeholder */}
        <div className="absolute inset-0 z-0">
          <GradientPlaceholder seed={restaurant.name + restaurant.id} className="w-full h-full" />
        </div>
        {/* External image - lazy loaded */}
        <LazyImage
          src={listImageUrl}
          alt={restaurant.name}
          className="absolute inset-0 z-10 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>{restaurant.name}</h3>
          {showFavorite && user && (
            <button onClick={(e) => { e.stopPropagation(); toggleFav.mutate({ restaurantId: restaurant.id }); }}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90"
              style={{ backgroundColor: isFav ? "var(--accent-gold)" : "transparent", border: isFav ? "none" : "1px solid var(--border-subtle)" }}>
              <Star size={14} fill={isFav ? "#fff" : "none"} color={isFav ? "#fff" : "var(--text-muted)"} />
            </button>
          )}
        </div>
        <div className="mt-1">
          <AwardBadge award={restaurant.award} size="sm" />
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span>{restaurant.cuisine}</span>
          <span style={{ color: "var(--border-medium)" }}>·</span>
          <span>{restaurant.city}{restaurant.district ? ` · ${restaurant.district}` : ""}</span>
          <span style={{ color: "var(--border-medium)" }}>·</span>
          <span style={{ color: "var(--text-gold)" }}>{priceText}</span>
        </div>
        {restaurant.rating && (
          <div className="flex items-center gap-1 mt-1 text-xs">
            <Star size={10} fill="var(--accent-gold)" color="var(--accent-gold)" />
            <span style={{ color: "var(--accent-gold)" }}>{restaurant.rating}</span>
            <span style={{ color: "var(--text-muted)" }}>({restaurant.reviewCount}条评价)</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Lazy image component: gradient placeholder shown immediately, image fades in when loaded
function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observerRef.current.observe(img);

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <img
      ref={imgRef}
      src={shouldLoad ? src : undefined}
      alt={alt}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}
