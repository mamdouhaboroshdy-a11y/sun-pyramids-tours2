import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { LangCode, LANGUAGES, translate } from '../i18n/translations';

const STORAGE_KEY = 'spt_lang';
// v2: previous versions could cache untranslated English fallbacks (when no
// Gemini key was set). Bumping the key discards those poisoned caches so the
// content gets re-translated once a key is available.
const DYN_CACHE_KEY = 'spt_dyn_cache_v2';

interface LanguageContextValue {
  lang: LangCode;
  dir: 'ltr' | 'rtl';
  setLang: (lang: LangCode) => void;
  /** Translate a STATIC UI string by key. */
  t: (key: string) => string;
  /** Translate DYNAMIC content (DB-sourced text). Returns original until the
   *  async translation arrives, then triggers a re-render with the result. */
  tt: (text: string | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

// ---- Module-level cache for dynamic translations -------------------------
// Shape: { [lang]: { [sourceText]: translatedText } }
type DynCache = Partial<Record<LangCode, Record<string, string>>>;

function loadDynCache(): DynCache {
  try {
    const raw = localStorage.getItem(DYN_CACHE_KEY);
    return raw ? (JSON.parse(raw) as DynCache) : {};
  } catch {
    return {};
  }
}

function detectInitialLang(): LangCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as LangCode | null;
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch { /* ignore */ }
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(detectInitialLang);
  // Bumped whenever new dynamic translations land, to force consumers to re-render.
  const [, setVersion] = useState(0);

  const dynCache = useRef<DynCache>(loadDynCache());
  const pending = useRef<Set<string>>(new Set());     // texts queued for the current flush
  const inFlight = useRef<Set<string>>(new Set());     // texts already requested (avoid dupes)
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set once the server reports it can't translate (no Gemini key). Stops us
  // from spamming the endpoint for the rest of the session; resets on reload,
  // so adding a key + refreshing re-enables translation.
  const providerDisabled = useRef(false);

  const dir = useMemo(
    () => LANGUAGES.find((l) => l.code === lang)?.dir ?? 'ltr',
    [lang],
  );

  // Reflect language + direction on <html> for correct RTL rendering.
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((next: LangCode) => {
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  const persistCache = useCallback(() => {
    try { localStorage.setItem(DYN_CACHE_KEY, JSON.stringify(dynCache.current)); } catch { /* ignore */ }
  }, []);

  const flush = useCallback(async () => {
    flushTimer.current = null;
    const targetLang = lang;
    if (targetLang === 'en') return;

    const texts = Array.from(pending.current).filter((tx) => !inFlight.current.has(tx));
    pending.current.clear();
    if (texts.length === 0) return;
    texts.forEach((tx) => inFlight.current.add(tx));

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: targetLang, texts }),
      });
      if (res.ok) {
        const data = (await res.json()) as { translations?: string[]; translated?: boolean };
        // Server returned originals (no API key / provider error): don't cache,
        // and stop trying for this session.
        if (data.translated === false) {
          providerDisabled.current = true;
          return;
        }
        const out = data.translations || [];
        const bucket = (dynCache.current[targetLang] ||= {});
        texts.forEach((tx, i) => { bucket[tx] = out[i] ?? tx; });
        persistCache();
        setVersion((v) => v + 1); // re-render with fresh translations
      }
    } catch {
      // Network/endpoint unavailable — keep originals; nothing to do.
    } finally {
      texts.forEach((tx) => inFlight.current.delete(tx));
    }
  }, [lang, persistCache]);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) return;
    flushTimer.current = setTimeout(() => { void flush(); }, 120);
  }, [flush]);

  const tt = useCallback((text: string | null | undefined): string => {
    if (!text) return text ?? '';
    if (lang === 'en') return text;
    const bucket = dynCache.current[lang];
    const hit = bucket?.[text];
    if (hit !== undefined) return hit;
    // No translation provider available this session: just show the original.
    if (providerDisabled.current) return text;
    // Not cached yet: queue for translation and show original meanwhile.
    if (!inFlight.current.has(text)) {
      pending.current.add(text);
      scheduleFlush();
    }
    return text;
  }, [lang, scheduleFlush]);

  const t = useCallback((key: string) => translate(lang, key), [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, dir, setLang, t, tt }),
    [lang, dir, setLang, t, tt],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
