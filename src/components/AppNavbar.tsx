'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GymQuestLogo } from '@/components/GymQuestLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { UserNavButton } from '@/components/UserNavButton';
import {
  IconDumbbell,
  IconTrophy,
  IconChart,
  IconCombat,
  IconFlame,
} from '@/components/ui/CyberIcons';
import { useLanguage } from '@/modules/i18n';
import { soundEngine } from '@/modules/game-engine/audio';

interface AppNavbarProps {
  activePage?: 'home' | 'programs' | 'leaderboard' | 'progress' | 'arena';
  subtitle?: string;
  showTagline?: boolean;
  onArenaClick?: (e?: React.MouseEvent) => void;
  streakDays?: number;
  showBackHome?: boolean;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  activePage,
  subtitle,
  showTagline = false,
  onArenaClick,
  streakDays,
  showBackHome = false,
}) => {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleNavClick = () => {
    soundEngine.playCountdownTick();
    setMobileMenuOpen(false);
  };

  const handleArenaNav = (e: React.MouseEvent) => {
    if (onArenaClick) {
      onArenaClick(e);
      setMobileMenuOpen(false);
    } else {
      handleNavClick();
    }
  };

  const isCurrent = (page: string) => {
    if (activePage) return activePage === page;
    if (page === 'home') return pathname === '/';
    return pathname.startsWith(`/${page}`);
  };

  return (
    <>
      <header className="glass-panel sticky top-2 sm:top-3 z-30 mx-2 sm:mx-3 rounded-2xl flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3.5 backdrop-blur-md shadow-[0_8px_40px_rgba(0,0,0,0.6)] border border-white/10">
        {/* LEFT: LOGO & BRAND */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {showBackHome && (
            <Link
              href="/"
              onClick={handleNavClick}
              className="mr-1 inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 border border-white/15 hover:bg-cyan/15 hover:border-cyan/40 hover:text-cyan text-muted transition-all"
              aria-label="Kembali ke Beranda"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
          )}

          <Link href="/" className="flex items-center gap-2 group min-w-0" onClick={handleNavClick}>
            <GymQuestLogo size="xs" variant="emblem" />
            <span className="font-display font-bold text-sm sm:text-base tracking-wider text-white group-hover:text-cyan transition-colors">
              GYMQUEST
            </span>
            {subtitle && (
              <span className="text-muted text-xs font-mono truncate hidden xs:inline">
                {subtitle}
              </span>
            )}
            {showTagline && (
              <span className="hidden lg:inline text-cyan/70 text-[10px] font-mono tracking-widest uppercase ml-1">
                · Your Fitness Adventure
              </span>
            )}
          </Link>
        </div>

        {/* CENTER / RIGHT: DESKTOP NAVIGATION (>= md) */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 font-body text-sm">
          <Link
            href="/programs"
            onClick={handleNavClick}
            className={`transition-colors font-medium flex items-center gap-1.5 px-2 py-1 rounded-lg ${
              isCurrent('programs')
                ? 'text-cyan bg-cyan/10 border border-cyan/30 shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                : 'text-white/80 hover:text-cyan'
            }`}
          >
            <IconDumbbell size={16} className="text-cyan" />
            <span>{t.nav.programs}</span>
          </Link>

          <Link
            href="/leaderboard"
            onClick={handleNavClick}
            className={`transition-colors font-medium flex items-center gap-1.5 px-2 py-1 rounded-lg ${
              isCurrent('leaderboard')
                ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 shadow-[0_0_12px_rgba(255,214,0,0.2)]'
                : 'text-white/80 hover:text-yellow-400'
            }`}
          >
            <IconTrophy size={16} className="text-yellow-400" />
            <span>{t.nav.leaderboard}</span>
          </Link>

          <Link
            href="/progress"
            onClick={handleNavClick}
            className={`transition-colors font-medium flex items-center gap-1.5 px-2 py-1 rounded-lg ${
              isCurrent('progress')
                ? 'text-cyan bg-cyan/10 border border-cyan/30 shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                : 'text-white/80 hover:text-cyan'
            }`}
          >
            <IconChart size={16} className="text-cyan" />
            <span>{t.nav.progress}</span>
            {typeof streakDays === 'number' && streakDays > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold ml-0.5">
                {streakDays}🔥
              </span>
            )}
          </Link>

          {/* ARENA LINK */}
          {onArenaClick ? (
            <button
              onClick={handleArenaNav}
              className={`font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                isCurrent('arena')
                  ? 'bg-magenta/25 border-magenta text-white shadow-[0_0_15px_rgba(255,0,128,0.4)]'
                  : 'text-magenta border-magenta/40 hover:bg-magenta/20 hover:text-white shadow-[0_0_12px_rgba(255,0,122,0.2)]'
              }`}
            >
              <IconCombat size={16} className="text-magenta" glow />
              <span>{t.nav.arena}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-magenta animate-ping" />
            </button>
          ) : (
            <Link
              href="/arena"
              onClick={handleNavClick}
              className={`font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                isCurrent('arena')
                  ? 'bg-magenta/25 border-magenta text-white shadow-[0_0_15px_rgba(255,0,128,0.4)]'
                  : 'text-magenta border-magenta/40 hover:bg-magenta/20 hover:text-white shadow-[0_0_12px_rgba(255,0,122,0.2)]'
              }`}
            >
              <IconCombat size={16} className="text-magenta" glow />
              <span>{t.nav.arena}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-magenta animate-ping" />
            </Link>
          )}

          <LanguageSwitcher compact />

          <div className="pl-2 border-l border-white/10">
            <UserNavButton />
          </div>
        </nav>

        {/* RIGHT: COMPACT MOBILE CONTROLS (< md) */}
        <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher compact />
          <UserNavButton />

          {/* HAMBURGER TOGGLE BUTTON */}
          <button
            onClick={() => {
              soundEngine.playCountdownTick();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            aria-label={mobileMenuOpen ? 'Tutup Menu' : 'Buka Menu'}
            aria-expanded={mobileMenuOpen}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${
              mobileMenuOpen
                ? 'bg-cyan/20 border-cyan text-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'bg-white/5 border-white/15 text-white hover:border-cyan/50 hover:text-cyan'
            }`}
          >
            {mobileMenuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* MOBILE FULL-SCREEN / SLIDE-DOWN DRAWER MENU */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/70 backdrop-blur-xl animate-fade-in flex flex-col pt-18 px-4 pb-8 overflow-y-auto"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-full max-w-sm mx-auto glass-panel rounded-3xl p-5 border border-cyan/40 bg-[#070d22]/95 shadow-[0_0_50px_rgba(0,229,255,0.2)] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* DRAWER HEADER */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <GymQuestLogo size="xs" variant="emblem" />
                <span className="font-display font-bold text-base text-white">Menu Navigasi</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted hover:text-white"
                aria-label="Tutup Menu"
              >
                ✕
              </button>
            </div>

            {/* NAV LINKS LIST */}
            <div className="space-y-2 font-body">
              <Link
                href="/programs"
                onClick={handleNavClick}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isCurrent('programs')
                    ? 'bg-cyan/20 border-cyan text-white shadow-[0_0_20px_rgba(0,229,255,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/90 hover:bg-white/10 hover:border-cyan/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan/15 border border-cyan/30 flex items-center justify-center">
                    <IconDumbbell size={18} className="text-cyan" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm">{t.nav.programs}</div>
                    <div className="text-[11px] text-muted font-mono">Kurikulum latihan sains ACSM</div>
                  </div>
                </div>
                <span className="text-cyan font-mono text-xs">➔</span>
              </Link>

              <Link
                href="/leaderboard"
                onClick={handleNavClick}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isCurrent('leaderboard')
                    ? 'bg-yellow-400/20 border-yellow-400 text-white shadow-[0_0_20px_rgba(255,214,0,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/90 hover:bg-white/10 hover:border-yellow-400/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center">
                    <IconTrophy size={18} className="text-yellow-400" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-yellow-300">{t.nav.leaderboard}</div>
                    <div className="text-[11px] text-muted font-mono">5 Kasta Liga RPG Mingguan</div>
                  </div>
                </div>
                <span className="text-yellow-400 font-mono text-xs">➔</span>
              </Link>

              <Link
                href="/progress"
                onClick={handleNavClick}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isCurrent('progress')
                    ? 'bg-cyan/20 border-cyan text-white shadow-[0_0_20px_rgba(0,229,255,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/90 hover:bg-white/10 hover:border-cyan/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan/15 border border-cyan/30 flex items-center justify-center">
                    <IconChart size={18} className="text-cyan" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm">{t.nav.progress}</div>
                    <div className="text-[11px] text-muted font-mono">
                      Kalender latihan & heatmap
                      {typeof streakDays === 'number' && streakDays > 0 && ` (${streakDays}🔥)`}
                    </div>
                  </div>
                </div>
                <span className="text-cyan font-mono text-xs">➔</span>
              </Link>

              {/* ARENA LINK */}
              {onArenaClick ? (
                <button
                  onClick={handleArenaNav}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                    isCurrent('arena')
                      ? 'bg-magenta/25 border-magenta text-white shadow-[0_0_20px_rgba(255,0,128,0.3)]'
                      : 'bg-magenta/10 border-magenta/40 text-white hover:bg-magenta/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-magenta/20 border border-magenta/40 flex items-center justify-center">
                      <IconCombat size={18} className="text-magenta" glow />
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm text-magenta">{t.nav.arena}</div>
                      <div className="text-[11px] text-muted font-mono">Dragon Ball Push-Up Battle & Games</div>
                    </div>
                  </div>
                  <span className="text-magenta font-mono text-xs">⚔️</span>
                </button>
              ) : (
                <Link
                  href="/arena"
                  onClick={handleNavClick}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isCurrent('arena')
                      ? 'bg-magenta/25 border-magenta text-white shadow-[0_0_20px_rgba(255,0,128,0.3)]'
                      : 'bg-magenta/10 border-magenta/40 text-white hover:bg-magenta/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-magenta/20 border border-magenta/40 flex items-center justify-center">
                      <IconCombat size={18} className="text-magenta" glow />
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm text-magenta">{t.nav.arena}</div>
                      <div className="text-[11px] text-muted font-mono">Dragon Ball Push-Up Battle & Games</div>
                    </div>
                  </div>
                  <span className="text-magenta font-mono text-xs">⚔️</span>
                </Link>
              )}
            </div>

            {/* QUICK STATS & FOOTER IN DRAWER */}
            {typeof streakDays === 'number' && (
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-muted">Status Rentetan:</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <IconFlame size={14} className="text-amber-400" />
                  {streakDays} Hari Latihan
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
