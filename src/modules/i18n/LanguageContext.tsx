'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SupportedLanguage, TranslationDictionary } from './types';
import { idTranslations } from './translations/id';
import { enTranslations } from './translations/en';

const STORAGE_KEY = 'gymquest_language_v1';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
  t: TranslationDictionary;
}

const dictionaries: Record<SupportedLanguage, TranslationDictionary> = {
  id: idTranslations,
  en: enTranslations,
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'id',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: idTranslations,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('id');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (savedLang === 'id' || savedLang === 'en') {
        setLanguageState(savedLang);
        document.documentElement.lang = savedLang;
      } else {
        // Cek bahasa default browser
        const browserLang = navigator.language?.toLowerCase();
        if (browserLang.startsWith('en')) {
          setLanguageState('en');
          document.documentElement.lang = 'en';
        } else {
          setLanguageState('id');
          document.documentElement.lang = 'id';
        }
      }
    } catch {
      // Fallback aman jika localStorage tidak tersedia
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch (e) {
      console.error('Failed to save language preference:', e);
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'id' ? 'en' : 'id';
    setLanguage(nextLang);
  };

  const t = dictionaries[language] || idTranslations;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
