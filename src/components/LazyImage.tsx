import { useState, useRef, useEffect } from "react";
import { GradientPlaceholder } from "./GradientBg";

interface Props {
  src: string;
  alt: string;
  className?: string;
  seed?: string;
  aspectRatio?: string;
  objectFit?: "cover" | "contain";
}

export default function LazyImage({ src, alt, className = "", seed = "default", aspectRatio, objectFit = "cover" }: Props) {
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${aspectRatio || ""} ${className}`}>
      {/* Fast gradient placeholder - always visible underneath */}
      <GradientPlaceholder seed={seed} className="absolute inset-0 w-full h-full" />
      {/* External image - lazy loaded, fades in */}
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full ${objectFit === "contain" ? "object-contain" : "object-cover"} transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}
