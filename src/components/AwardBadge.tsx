import { Star } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";

interface Props {
  award: string;
  size?: "sm" | "md" | "lg";
}

const awardConfig: Record<string, { stars: number; color: string }> = {
  "3-star": { stars: 3, color: "#DC2626" },
  "2-star": { stars: 2, color: "#EF4444" },
  "1-star": { stars: 1, color: "#F87171" },
  "bib-gourmand": { stars: 0, color: "#E8903A" },
  "selected": { stars: 0, color: "#6B665E" },
};

export default function AwardBadge({ award, size = "sm" }: Props) {
  const { $t } = useLocale();
  const config = awardConfig[award] || awardConfig.selected;
  const starSize = size === "lg" ? 16 : size === "md" ? 14 : 12;
  const textSize = size === "lg" ? "text-sm" : "text-xs";
  const label = $t(`award.${award}`);

  return (
    <span className={`inline-flex items-center gap-1 ${textSize}`}>
      {config.stars > 0 ? (
        <span className="flex items-center gap-0.5">
          {Array.from({ length: config.stars }).map((_, i) => (
            <Star key={i} size={starSize} fill={config.color} color={config.color} />
          ))}
        </span>
      ) : (
        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
      )}
      <span style={{ color: config.color }}>{label}</span>
    </span>
  );
}
