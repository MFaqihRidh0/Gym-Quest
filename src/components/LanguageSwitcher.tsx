'use client';

import React from 'react';
import { useLanguage } from '@/modules/i18n';
import { soundEngine } from '@/modules/game-engine/audio';

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  const handleSelect = (lang: 'id' | 'en') => {
    if (lang === language) return;
    try {
      soundEngine.playCountdownTick();
    } catch {
      // Audio fallback safe
    }
    setLanguage(lang);
  };

  return (
    <div
      className="inline-flex items-center rounded-lg border border-white/10 bg-slate-900/80 p-0.5 backdrop-blur-md shadow-inner"
      role="group"
      aria-label="Language selection"
    >
      <button
        onClick={() => handleSelect('id')}
        type="button"
        title="Bahasa Indonesia"
        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all duration-200 ${
          language === 'id'
            ? 'bg-cyan/20 text-cyan border border-cyan/40 shadow-[0_0_12px_rgba(0,229,255,0.35)]'
            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
        }`}
      >
        <span className="text-sm leading-none">🇮🇩</span>
        <span className={compact ? 'hidden sm:inline' : 'inline'}>ID</span>
      </button>

      <button
        onClick={() => handleSelect('en')}
        type="button"
        title="English"
        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all duration-200 ${
          language === 'en'
            ? 'bg-cyan/20 text-cyan border border-cyan/40 shadow-[0_0_12px_rgba(0,229,255,0.35)]'
            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
        }`}
      >
        <span className="text-sm leading-none">🇬🇧</span>
        <span className={compact ? 'hidden sm:inline' : 'inline'}>EN</span>
      </button>
    </div>
  );
}
