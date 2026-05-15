import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { trpc } from "@/providers/trpc";
import RestaurantCard from "@/components/RestaurantCard";

export default function Favorites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { $t } = useLocale();
  const { data: favorites, isLoading } = trpc.favorite.list.useQuery(undefined, { enabled: !!user });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "var(--bg-elevated)" }}>
          <Heart size={24} style={{ color: "var(--text-muted)" }} />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{$t("fav.login.title")}</h2>
        <p className="text-sm mb-6 text-center" style={{ color: "var(--text-secondary)" }}>{$t("fav.login.desc")}</p>
        <button onClick={() => navigate("/login")}
          className="px-6 py-3 rounded-xl text-sm font-medium transition-all hover:scale-105"
          style={{ backgroundColor: "var(--accent-gold)", color: "#0A0A0F" }}>
          {$t("fav.login.cta")}
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="w-8 h-8 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "var(--bg-elevated)" }}>
          <Heart size={24} style={{ color: "var(--text-muted)" }} />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{$t("fav.empty.title")}</h2>
        <p className="text-sm mb-6 text-center" style={{ color: "var(--text-secondary)" }}>{$t("fav.empty.desc")}</p>
        <button onClick={() => navigate("/discover")}
          className="px-6 py-3 rounded-xl text-sm font-medium transition-all hover:scale-105"
          style={{ backgroundColor: "var(--accent-gold)", color: "#0A0A0F" }}>
          {$t("fav.empty.cta")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Noto Serif SC', serif", color: "var(--text-primary)" }}>{$t("nav.favorites")}</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>{$t("fav.count", { count: favorites.length })}</p>
        <div className="space-y-1">
          {favorites.map((fav) => fav.restaurant && <RestaurantCard key={fav.id} restaurant={fav.restaurant as any} variant="list" showFavorite={false} />)}
        </div>
      </div>
    </div>
  );
}
