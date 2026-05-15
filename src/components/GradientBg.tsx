// Generate a consistent gradient background based on a seed string
const gradientPalette = [
  ["#1a1a2e", "#16213e", "#0f3460"],
  ["#2d132c", "#801336", "#c72c41"],
  ["#1b262c", "#0f4c75", "#3282b8"],
  ["#2c003e", "#51007a", "#7a0099"],
  ["#1a1a1a", "#4a4a4a", "#2d2d2d"],
  ["#0d1321", "#1d2d44", "#3e5c76"],
  ["#1a0a2e", "#431259", "#80287c"],
  ["#0f0f23", "#1a1a3e", "#2d2d5a"],
  ["#1c1018", "#4a1c40", "#8b2f5c"],
  ["#0a1628", "#1b3a4b", "#2c5f7c"],
  ["#1a1005", "#5c3a1e", "#8b5e3c"],
  ["#0d1f1d", "#1a3c38", "#2d6b62"],
];

function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getGradientStyle(seed: string): React.CSSProperties {
  const hash = stringToHash(seed);
  const palette = gradientPalette[hash % gradientPalette.length];
  const angle = (hash % 360);
  return {
    background: `linear-gradient(${angle}deg, ${palette[0]}, ${palette[1]}, ${palette[2]})`,
  };
}

export function getCityColor(city: string): string {
  const cityColors: Record<string, string> = {
    "上海": "#C8913A", "北京": "#DC2626", "广州": "#059669",
    "成都": "#D97706", "杭州": "#0891B2", "深圳": "#2563EB",
    "香港": "#7C3AED", "澳门": "#BE185D", "台北": "#0891B2",
    "台中": "#059669", "台南": "#D97706", "高雄": "#2563EB",
    "南京": "#7C3AED", "苏州": "#0891B2", "福州": "#059669",
    "厦门": "#0891B2",
  };
  return cityColors[city] || "#6B665E";
}

export function GradientPlaceholder({ seed, children, className = "" }: { seed: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={getGradientStyle(seed)}>
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 30% 40%, rgba(200,145,58,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.1) 0%, transparent 40%)`,
      }} />
      <div className="relative z-10 flex items-center justify-center h-full">
        {children || (
          <span className="text-3xl font-bold opacity-20" style={{ fontFamily: "'Playfair Display', serif", color: "#fff" }}>
            {seed.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}
