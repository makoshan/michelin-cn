import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, UserPlus, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { $t } = useLocale();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: (data) => { login(data.token, data.user); navigate("/"); },
    onError: (err) => setError(err.message),
  });
  const registerMutation = trpc.localAuth.register.useMutation({
    onSuccess: (data) => { login(data.token, data.user); navigate("/"); },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) { setError($t("login.error.fill")); return; }
    if (mode === "register" && password.length < 6) { setError($t("login.error.short")); return; }
    if (mode === "login") loginMutation.mutate({ username, password });
    else registerMutation.mutate({ username, password, email: email || undefined });
  };

  const isSubmitting = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="w-full max-w-md">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm mb-8 transition-colors hover:text-[var(--accent-gold)]" style={{ color: "var(--text-secondary)" }}>
          <ChevronLeft size={16} />{$t("city.back")}
        </button>
        <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--accent-gold)" }}>
              {$t("login.title")}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {mode === "login" ? $t("login.loginDesc") : $t("login.registerDesc")}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>{$t("login.username")}</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder={$t("login.usernamePlaceholder")} className="w-full px-4 py-3 rounded-xl text-sm outline-none border focus:border-[var(--accent-gold)] transition-colors"
                style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", borderColor: "var(--border-subtle)" }} />
            </div>
            {mode === "register" && (
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>{$t("login.email")}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={$t("login.emailPlaceholder")} className="w-full px-4 py-3 rounded-xl text-sm outline-none border focus:border-[var(--accent-gold)] transition-colors"
                  style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", borderColor: "var(--border-subtle)" }} />
              </div>
            )}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>{$t("login.password")}</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? $t("login.registerPassword") : $t("login.passwordPlaceholder")}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border focus:border-[var(--accent-gold)] transition-colors pr-12"
                  style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", borderColor: "var(--border-subtle)" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff size={16} style={{ color: "var(--text-muted)" }} /> : <Eye size={16} style={{ color: "var(--text-muted)" }} />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>}
            <button type="submit" disabled={isSubmitting}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--accent-gold)", color: "#0A0A0F" }}>
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-[#0A0A0F] border-t-transparent rounded-full animate-spin" />
              ) : mode === "login" ? (
                <><LogIn size={16} />{$t("login.loginBtn")}</>
              ) : (
                <><UserPlus size={16} />{$t("login.registerBtn")}</>
              )}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-sm transition-colors hover:text-[var(--accent-gold-light)]" style={{ color: "var(--accent-gold)" }}>
              {mode === "login" ? $t("login.switchRegister") : $t("login.switchLogin")}
            </button>
          </div>
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{$t("login.or")}</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
          </div>
          <button onClick={() => {
            const authUrl = `${import.meta.env.VITE_KIMI_AUTH_URL}/api/oauth/authorize?client_id=${import.meta.env.VITE_APP_ID}&redirect_uri=${encodeURIComponent(window.location.origin + "/api/oauth/callback")}&response_type=code&scope=profile&state=${btoa(window.location.origin)}`;
            window.location.href = authUrl;
          }}
            className="w-full py-3 rounded-xl text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
            {$t("login.kimi")}
          </button>
        </div>
      </div>
    </div>
  );
}
