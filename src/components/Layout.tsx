import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Search, Heart, MapPin, Compass, Bot, LogIn, LogOut, Menu, X, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import AIChatPanel from "@/components/AIChatPanel";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { locale, toggleLocale, $t } = useLocale();
  const [navHidden, setNavHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setNavHidden(true);
      } else {
        setNavHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const navItems = [
    { label: $t("nav.discover"), icon: Compass, path: "/discover" },
    { label: $t("nav.map"), icon: MapPin, path: "/map" },
    { label: $t("nav.city"), icon: MapPin, path: "/city/杭州" },
    { label: $t("nav.favorites"), icon: Heart, path: "/favorites" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${navHidden ? "-translate-y-full" : "translate-y-0"}`}
        style={{ backgroundColor: "rgba(10,10,15,0.85)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <span className="text-lg font-bold tracking-wide" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--accent-gold)" }}>
                MICHELIN GUIDE
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: "var(--accent-gold)", color: "#0A0A0F" }}>
                {locale === "zh" ? "中国" : "CHINA"}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className="flex items-center gap-1.5 text-sm transition-colors hover:text-[var(--accent-gold)]"
                  style={{ color: location.pathname.startsWith(item.path.split("/")[1] || item.path) ? "var(--accent-gold)" : "var(--text-secondary)" }}>
                  <item.icon size={16} />{item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <button
                onClick={toggleLocale}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-[var(--bg-elevated)]"
                title={locale === "zh" ? "Switch to English" : "切换到中文"}
              >
                <Globe size={14} style={{ color: "var(--text-muted)" }} />
                <span style={{ color: "var(--text-secondary)" }}>{locale === "zh" ? "EN" : "中"}</span>
              </button>

              <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]">
                <Search size={18} style={{ color: "var(--text-secondary)" }} />
              </button>
              <button onClick={() => setAiPanelOpen(true)} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105" style={{ backgroundColor: "var(--accent-gold)", color: "#0A0A0F" }}>
                <Bot size={16} />{$t("nav.aiAdvisor")}
              </button>
              {user ? (
                <button onClick={() => { logout(); navigate("/"); }} className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]" title={$t("nav.logout")}>
                  <LogOut size={18} style={{ color: "var(--text-secondary)" }} />
                </button>
              ) : (
                <button onClick={() => navigate("/login")} className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]">
                  <LogIn size={18} style={{ color: "var(--text-secondary)" }} />
                </button>
              )}
              <button className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-elevated)]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}>
            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={$t("home.hero.placeholder")}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none border focus:border-[var(--accent-gold)]"
                  style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", borderColor: "var(--border-subtle)" }} autoFocus />
                {searchQuery && <button type="button" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={16} style={{ color: "var(--text-muted)" }} /></button>}
              </div>
            </form>
          </div>
        )}
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 pt-16 px-4 py-4 space-y-2" style={{ backgroundColor: "rgba(10,10,15,0.95)" }}>
          {navItems.map((item) => (
            <button key={item.path} onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-colors hover:bg-[var(--bg-elevated)]"
              style={{ color: "var(--text-secondary)" }}>
              <item.icon size={20} /><span className="text-base">{item.label}</span>
            </button>
          ))}
          <button onClick={() => { setAiPanelOpen(true); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left" style={{ color: "var(--accent-gold)" }}>
            <Bot size={20} /><span className="text-base">{$t("nav.aiAdvisor")}</span>
          </button>
          <div className="border-t pt-2 mt-2" style={{ borderColor: "var(--border-subtle)" }}>
            <button onClick={() => { toggleLocale(); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left" style={{ color: "var(--text-secondary)" }}>
              <Globe size={20} /><span className="text-base">{locale === "zh" ? "English" : "中文"}</span>
            </button>
          </div>
        </div>
      )}

      <main className="pt-16 min-h-screen">
        <Outlet />
      </main>

      <AIChatPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />

      <button onClick={() => setAiPanelOpen(true)} className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 sm:hidden" style={{ backgroundColor: "var(--accent-gold)", boxShadow: "0 4px 20px rgba(200,145,58,0.3)" }}>
        <Bot size={24} color="#fff" />
      </button>
    </div>
  );
}
