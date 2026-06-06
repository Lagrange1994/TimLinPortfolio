import React, { createContext, useContext, useState, useMemo } from 'react';
import { translations, heroDescTexts } from '../i18n/translations';
import type { Lang } from '../i18n/translations';

// Use a loose type so zh/en string literals don't conflict
type TranslationShape = Record<string, string>;

interface LangContextValue {
  lang: Lang;
  t: TranslationShape;
  setLang: (lang: Lang) => void;
  heroDescs: string[];
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('lang');
    return (stored === 'zh' || stored === 'en') ? stored : 'zh';
  });

  const setLang = (newLang: Lang) => {
    localStorage.setItem('lang', newLang);
    setLangState(newLang);
  };

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      t: translations[lang] as TranslationShape,
      setLang,
      heroDescs: heroDescTexts[lang],
    }),
    [lang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within a LangProvider');
  return ctx;
}
