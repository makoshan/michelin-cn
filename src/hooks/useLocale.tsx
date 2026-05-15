import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Locale } from "@/i18n";
import { t } from "@/i18n";

interface LocaleContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  $t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "zh",
  setLocale: () => {},
  toggleLocale: () => {},
  $t: (key: string) => key,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("michelin_locale") as Locale;
      if (saved === "zh" || saved === "en") return saved;
      const browserLang = navigator.language;
      if (browserLang.startsWith("zh")) return "zh";
    }
    return "zh";
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("michelin_locale", l);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === "zh" ? "en" : "zh";
      localStorage.setItem("michelin_locale", next);
      return next;
    });
  }, []);

  const $t = useCallback(
    (key: string, params?: Record<string, string | number>) => t(key, locale, params),
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggleLocale, $t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
