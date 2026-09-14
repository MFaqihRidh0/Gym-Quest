'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserNavButton } from '@/components/UserNavButton';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AuthModal } from '@/components/AuthModal';
import { InteractiveText } from '@/components/ui/InteractiveText';
import { getActiveUser } from '@/modules/auth/syncManager';
import { soundEngine } from '@/modules/game-engine/audio';
import { useLanguage } from '@/modules/i18n';
import type { User } from '@supabase/supabase-js';
import {
  IconBolt,
  IconFlame,
  IconCyberBot,
  IconCombat,
  IconTrophy,
  IconCrown,
  IconTarget,
  IconShield,
  IconDumbbell,
  IconBarbell,
  IconBurst,
  IconChart,
  IconCamera,
  IconUsers,
  IconLock,
} from '@/components/ui/CyberIcons';

export default function Home() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showArenaLoginGate, setShowArenaLoginGate] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const modes = [
    {
      title: t.home.modeProgramsTitle,
      accent: 'cyan' as const,
      iconType: 'dumbbell' as const,
      status: t.home.modeProgramsBadge,
      href: '/programs',
      requiresAuth: false,
      description: t.home.modeProgramsDesc,
    },
    {
      title: t.home.modeArenaTitle,
      accent: 'magenta' as const,
      iconType: 'combat' as const,
      status: t.home.modeArenaBadge,
      href: '/arena',
      requiresAuth: true,
      description: t.home.modeArenaDesc,
    },
    {
      title: t.home.modeProgressTitle,
      accent: 'cyan' as const,
      iconType: 'chart' as const,
      status: t.home.modeProgressBadge,
      href: '/progress',
      requiresAuth: false,
      description: t.home.modeProgressDesc,
    },
    {
      title: t.home.modeLeaderboardTitle,
      accent: 'yellow' as const,
      iconType: 'trophy' as const,
      status: t.home.modeLeaderboardBadge,
      href: '/leaderboard',
      requiresAuth: false,
      description: t.home.modeLeaderboardDesc,
    },
  ];

  // Check login state on mount
  useEffect(() => {
    let isMounted = true;
    getActiveUser().then((u) => {
      if (isMounted) setCurrentUser(u);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleArenaClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    soundEngine.playCountdownTick();

    if (currentUser) {
      router.push('/arena');
    } else {
      setShowArenaLoginGate(true);
    }
  };

  const handleAuthSuccess = (u: User) => {
    setCurrentUser(u);
    setShowAuthModal(false);
    setShowArenaLoginGate(false);
    // Masuk ke Arena setelah login berhasil
    router.push('/arena');
  };

  return (
    <main className="min-h-screen flex flex-col bg-transparent text-primary selection:bg-cyan selection:text-void">
      {/* 1. PROMINENT MODERN HEADER */}
      <header className="glass-panel sticky top-3 z-30 mx-3 rounded-2xl flex items-center justify-between px-6 py-4 backdrop-blur-md shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
        {/* LOGO & BRAND */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan via-blue-600 to-magenta p-0.5 shadow-[0_0_20px_rgba(0,229,255,0.4)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-void rounded-[10px] flex items-center justify-center">
              <IconBarbell size={22} className="text-cyan" glow />
            </div>
          </div>
          <div>
            <div className="font-display font-black text-xl tracking-wider bg-gradient-to-r from-white via-cyan to-magenta bg-clip-text text-transparent">
              GYMQUEST
            </div>
          </div>
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="flex items-center gap-2 sm:gap-6 font-body text-sm">
          <Link
            href="/programs"
            className="text-white hover:text-cyan transition-colors font-medium flex items-center gap-1.5 px-2 py-1"
          >
            <IconDumbbell size={16} className="text-cyan" />
            <span className="hidden md:inline">{t.nav.programs}</span>
          </Link>

          <Link
            href="/leaderboard"
            className="text-white hover:text-yellow-400 transition-colors font-medium flex items-center gap-1.5 px-2 py-1"
          >
            <IconTrophy size={16} className="text-yellow-400" />
            <span className="hidden md:inline">{t.nav.leaderboard}</span>
          </Link>

          <Link
            href="/progress"
            className="text-muted hover:text-cyan transition-colors font-medium flex items-center gap-1.5 px-2 py-1"
          >
            <IconChart size={16} className="text-cyan" />
            <span className="hidden md:inline">{t.nav.progress}</span>
          </Link>

          {/* ARENA LINK (INTERCEPTED WITH LOGIN CHECK) */}
          <button
            onClick={handleArenaClick}
            className="text-magenta hover:text-white font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-magenta/40 hover:bg-magenta/20 transition-all shadow-[0_0_12px_rgba(255,0,122,0.2)]"
          >
            <IconCombat size={16} className="text-magenta" glow />
            <span>{t.nav.arena}</span>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-magenta animate-ping" />
          </button>

          <LanguageSwitcher compact />

          <div className="pl-2 border-l border-white/10">
            <UserNavButton />
          </div>
        </nav>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden px-5 py-16 sm:py-24 flex-1 flex flex-col justify-center">
        {/* BACKGROUND GLOW ACCENTS */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan/15 blur-[120px] rounded-full" />
        <div className="pointer-events-none absolute top-1/3 right-10 w-[500px] h-[300px] bg-magenta/15 blur-[140px] rounded-full" />

        <div className="mx-auto w-full max-w-6xl relative z-10 space-y-8">
          {/* MAIN HEADLINE */}
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.18] text-balance max-w-4xl text-white animate-hero-sway-delayed">
            <InteractiveText text={t.home.heroTitleLine1} />{' '}
            <span className="inline-block relative underline decoration-cyan/40 decoration-wavy">
              <InteractiveText
                text={t.home.heroTitleLine2}
                isGradient={true}
                baseDelay={32}
              />
            </span>
          </h1>

          {/* SUBHEADLINE */}
          <p className="max-w-2xl font-body text-base sm:text-xl text-muted leading-relaxed">
            {t.home.heroSubtitle}
          </p>

          {/* CALL TO ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/programs"
              className="clip-corner bg-gradient-to-r from-cyan to-magenta px-8 py-4 font-body text-sm font-bold text-void transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,229,255,0.6)] hover:scale-105"
            >
              {t.home.ctaStart} ▸
            </Link>

            <Link
              href="/leaderboard"
              className="clip-corner border border-yellow-400/50 bg-yellow-400/10 px-7 py-4 font-body text-sm font-semibold text-yellow-400 transition-all hover:bg-yellow-400/20 hover:scale-105 flex items-center gap-2"
            >
              <IconTrophy size={18} className="text-yellow-400" glow />
              <span>{t.nav.leaderboard}</span>
            </Link>

            <button
              onClick={handleArenaClick}
              className="clip-corner border border-magenta/60 bg-magenta/15 px-7 py-4 font-body text-sm font-bold text-white transition-all hover:bg-magenta/25 hover:scale-105 shadow-[0_0_20px_rgba(255,0,122,0.3)] flex items-center gap-2"
            >
              <IconCombat size={18} className="text-magenta" glow />
              <span>{t.home.modeArenaTitle}</span>
            </button>
          </div>

          {/* FEATURE SPOTLIGHT: ARENA PUSH-UP BATTLE */}
          <div className="mt-12 rounded-2xl border-2 border-magenta/40 bg-gradient-to-r from-magenta/15 via-void to-cyan/15 p-6 sm:p-8 backdrop-blur-md shadow-[0_0_50px_rgba(255,0,122,0.15)] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-magenta/20 text-magenta font-mono text-xs font-bold uppercase tracking-wider">
                <IconBolt size={14} className="text-magenta" glow />
                <span>{t.home.modeArenaBadge}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                <span>{t.home.modeArenaTitle}</span>
                <IconBurst size={26} className="text-amber-400 animate-pulse" glow />
              </h2>
              <p className="text-sm text-muted max-w-xl">
                {t.home.modeArenaDesc}
              </p>
            </div>
            <button
              onClick={handleArenaClick}
              className="whitespace-nowrap px-6 py-3 rounded-xl bg-magenta text-white font-display font-bold text-sm hover:bg-magenta/80 transition-all shadow-[0_0_25px_rgba(255,0,122,0.5)] hover:scale-105 flex items-center gap-2"
            >
              <span>{t.common.start}</span>
              <IconCombat size={18} className="text-white" />
            </button>
          </div>

          {/* 4 FEATURE MODE CARDS */}
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {modes.map((mode) => {
              const card = (
                <article
                  key={mode.title}
                  className="glass-panel clip-corner flex h-full flex-col justify-between p-6 transition-all duration-300 hover:border-white/30 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-void/80 space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                        {mode.iconType === 'dumbbell' && <IconDumbbell size={24} className="text-cyan" glow />}
                        {mode.iconType === 'combat' && <IconCombat size={24} className="text-magenta" glow />}
                        {mode.iconType === 'chart' && <IconChart size={24} className="text-cyan" glow />}
                        {mode.iconType === 'trophy' && <IconTrophy size={24} className="text-amber-400" glow />}
                      </div>
                      <span
                        className={`clip-corner px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase ${
                          mode.accent === 'magenta'
                            ? 'bg-magenta/15 text-magenta border border-magenta/30'
                            : mode.accent === 'yellow'
                              ? 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/30'
                              : 'bg-cyan/15 text-cyan border border-cyan/30'
                        }`}
                      >
                        {mode.status}
                      </span>
                    </div>

                    <h3
                      className={`font-display text-lg font-bold ${
                        mode.accent === 'magenta'
                          ? 'text-magenta'
                          : mode.accent === 'yellow'
                            ? 'text-yellow-400'
                            : 'text-cyan'
                      }`}
                    >
                      {mode.title}
                    </h3>

                    <p className="font-body text-xs text-muted leading-relaxed">
                      {mode.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-muted group-hover:text-white">
                    <span>{t.common.start}</span>
                    <span className="text-base">→</span>
                  </div>
                </article>
              );

              if (mode.requiresAuth) {
                return (
                  <button
                    key={mode.title}
                    onClick={handleArenaClick}
                    className="text-left group cursor-pointer focus:outline-none"
                  >
                    {card}
                  </button>
                );
              }

              return (
                <Link key={mode.title} href={mode.href} className="group">
                  {card}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. DEDICATED MODERN FOOTER PANEL */}
      <footer className="glass-panel border-x-0 border-b-0 bg-void/95 border-t border-white/10 mt-16 pt-12 pb-8 px-6 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-6xl space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* COLUMN 1: BRANDING & MISSION */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-magenta p-0.5">
                  <div className="w-full h-full bg-void rounded-[6px] flex items-center justify-center">
                    <IconBarbell size={18} className="text-cyan" />
                  </div>
                </div>
                <span className="font-display font-bold text-lg text-white">GYMQUEST</span>
              </div>
              <p className="text-xs text-muted leading-relaxed font-body">
                {t.home.footerAboutDesc}
              </p>
              <div className="p-2.5 rounded-lg border border-cyan/20 bg-cyan/5 text-[10px] font-mono text-cyan flex items-start gap-1.5">
                <IconLock size={13} className="text-cyan shrink-0 mt-0.5" />
                <span>
                  <strong>{t.home.statPrivacy}:</strong> {t.home.statLocalDesc}
                </span>
              </div>
            </div>

            {/* COLUMN 2: FITUR UTAMA */}
            <div className="space-y-3">
              <div className="font-display font-bold text-sm text-white uppercase tracking-wider">
                {t.home.footerQuickLinks}
              </div>
              <ul className="space-y-2 text-xs font-body text-muted">
                <li>
                  <Link href="/programs" className="hover:text-cyan transition-colors flex items-center gap-2">
                    <IconDumbbell size={14} className="text-cyan" />
                    <span>{t.nav.programs}</span>
                  </Link>
                </li>
                <li>
                  <button onClick={handleArenaClick} className="hover:text-magenta transition-colors text-left flex items-center gap-2">
                    <IconCombat size={14} className="text-magenta" />
                    <span>{t.home.modeArenaTitle}</span>
                  </button>
                </li>
                <li>
                  <Link href="/leaderboard" className="hover:text-yellow-400 transition-colors flex items-center gap-2">
                    <IconTrophy size={14} className="text-yellow-400" />
                    <span>{t.home.modeLeaderboardTitle}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/progress" className="hover:text-cyan transition-colors flex items-center gap-2">
                    <IconChart size={14} className="text-cyan" />
                    <span>{t.home.modeProgressTitle}</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* COLUMN 3: TEKNOLOGI */}
            <div className="space-y-3">
              <div className="font-display font-bold text-sm text-white uppercase tracking-wider">
                Teknologi & Standar
              </div>
              <ul className="space-y-2 text-xs font-mono text-muted">
                <li className="flex items-center gap-1.5">
                  <IconBolt size={13} className="text-cyan" />
                  <span>Next.js 15 App Router & Turbopack</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <IconCyberBot size={13} className="text-magenta" />
                  <span>MediaPipe Pose Landmarker Vision</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <IconDumbbell size={13} className="text-yellow-400" />
                  <span>HTML5 Canvas 2D & WebGL Engine</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <IconBurst size={13} className="text-amber-400" />
                  <span>Web Audio API Sound Engine</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <IconShield size={13} className="text-cyan" />
                  <span>Supabase Auth & Cloud Database</span>
                </li>
              </ul>
            </div>

            {/* COLUMN 4: KOMUNITAS & SOSIAL */}
            <div className="space-y-3">
              <div className="font-display font-bold text-sm text-white uppercase tracking-wider">
                Komunitas & Berbagi
              </div>
              <p className="text-xs text-muted leading-relaxed font-body">
                Bagikan rekor repetisi latihanmu langsung ke WhatsApp atau buat poster Instagram Story (9:16)
                beresolusi tinggi otomatis.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleArenaClick}
                  className="w-full text-center px-3 py-2 rounded border border-magenta/40 bg-magenta/10 hover:bg-magenta/20 text-magenta font-mono text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <IconUsers size={15} className="text-magenta" />
                  <span>Masuk Komunitas Arena</span>
                </button>
              </div>
            </div>
          </div>

          {/* DEDICATED DEVELOPER TEAM SECTION */}
          <div className="p-6 rounded-2xl border border-cyan/30 bg-gradient-to-r from-cyan/10 via-white/5 to-magenta/10 space-y-4 shadow-[0_0_30px_rgba(0,229,255,0.08)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-cyan/20 border border-cyan/40 text-cyan">
                  <IconCrown size={20} className="text-cyan" glow />
                </span>
                <div>
                  <div className="text-[10px] font-mono tracking-wider text-muted uppercase">
                    {t.home.footerDeveloperTeam}
                  </div>
                  <h4 className="font-display text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                    <span>Semoga Kami Beruntung</span>
                    <IconBolt size={16} className="text-amber-400" glow />
                  </h4>
                </div>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full border border-cyan/40 bg-cyan/10 text-[11px] font-mono text-cyan">
                {t.home.footerCompetitionNotice}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* MEMBER 1: M. FAQIH RIDHO (KETUA) */}
              <div className="glass-panel p-3.5 rounded-xl border border-cyan/40 bg-cyan/5 hover:border-cyan hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] transition-all space-y-1.5 group">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-cyan/20 border border-cyan flex items-center justify-center font-display font-bold text-xs text-cyan group-hover:scale-110 transition-transform">
                    FR
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-400 text-void shadow-[0_0_8px_rgba(251,191,36,0.6)] flex items-center gap-1">
                    <IconCrown size={10} className="text-void" />
                    <span>{t.home.footerLeader.toUpperCase()}</span>
                  </span>
                </div>
                <div className="font-display text-sm font-bold text-white pt-1">
                  M. Faqih Ridho
                </div>
                <div className="text-[11px] font-mono text-cyan">
                  {t.home.footerLeader}
                </div>
              </div>

              {/* MEMBER 2: ANANDA FITRI WIBOWO */}
              <div className="glass-panel p-3.5 rounded-xl border border-white/10 bg-white/5 hover:border-magenta hover:shadow-[0_0_20px_rgba(255,0,122,0.2)] transition-all space-y-1.5 group">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-magenta/20 border border-magenta flex items-center justify-center font-display font-bold text-xs text-magenta group-hover:scale-110 transition-transform">
                    AF
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono text-muted bg-white/10">
                    {t.home.footerMember.toUpperCase()}
                  </span>
                </div>
                <div className="font-display text-sm font-bold text-white pt-1">
                  Ananda Fitri Wibowo
                </div>
                <div className="text-[11px] font-mono text-magenta">
                  {t.home.footerMember}
                </div>
              </div>

              {/* MEMBER 3: MUHAMMAD ARDIANSYAH TRI WIBOWO */}
              <div className="glass-panel p-3.5 rounded-xl border border-white/10 bg-white/5 hover:border-cyan hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] transition-all space-y-1.5 group">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-cyan/20 border border-cyan flex items-center justify-center font-display font-bold text-xs text-cyan group-hover:scale-110 transition-transform">
                    AT
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono text-muted bg-white/10">
                    {t.home.footerMember.toUpperCase()}
                  </span>
                </div>
                <div className="font-display text-sm font-bold text-white pt-1">
                  Muhammad Ardiansyah Tri Wibowo
                </div>
                <div className="text-[11px] font-mono text-cyan">
                  {t.home.footerMember}
                </div>
              </div>

              {/* MEMBER 4: MUHAMMAD ZIDDAN HABIBI */}
              <div className="glass-panel p-3.5 rounded-xl border border-white/10 bg-white/5 hover:border-yellow-400 hover:shadow-[0_0_20px_rgba(250,204,21,0.2)] transition-all space-y-1.5 group">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-yellow-400/20 border border-yellow-400 flex items-center justify-center font-display font-bold text-xs text-yellow-400 group-hover:scale-110 transition-transform">
                    ZH
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono text-muted bg-white/10">
                    {t.home.footerMember.toUpperCase()}
                  </span>
                </div>
                <div className="font-display text-sm font-bold text-white pt-1">
                  Muhammad Ziddan Habibi
                </div>
                <div className="text-[11px] font-mono text-yellow-400">
                  {t.home.footerMember}
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM DISCLAIMER & COPYRIGHT */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-body text-muted">
            <p className="max-w-2xl text-[11px] leading-relaxed text-center md:text-left flex items-start gap-1.5">
              <IconShield size={14} className="text-yellow-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white/90">{t.home.footerDisclaimerTitle}</strong> {t.home.footerDisclaimerText}
              </span>
            </p>
            <div className="font-mono text-[11px] text-muted whitespace-nowrap">
              {t.home.footerCopyrightNotice}
            </div>
          </div>
        </div>
      </footer>

      {/* 4. ARENA MODE LOGIN GATE MODAL */}
      {showArenaLoginGate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel clip-corner w-full max-w-lg border-2 border-magenta/60 p-6 sm:p-8 bg-void/98 space-y-6 shadow-[0_0_60px_rgba(255,0,122,0.35)] relative overflow-hidden">
            {/* BACKGROUND GLOW */}
            <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 bg-magenta/30 blur-3xl rounded-full" />

            <div className="flex items-start justify-between border-b border-magenta/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-magenta/20 border-2 border-magenta flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(255,0,122,0.4)] animate-pulse">
                  <IconCombat size={24} className="text-magenta" glow />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-white">
                    Login Diperlukan untuk Arena Mode
                  </h3>
                  <p className="font-mono text-xs text-magenta font-bold">
                    Kolaborasi & Pertarungan Komunitas Online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowArenaLoginGate(false)}
                className="text-muted hover:text-white text-lg p-1"
                aria-label="Tutup modal"
              >
                ✕
              </button>
            </div>

            {/* EXPLANATION WHY LOGIN IS REQUIRED */}
            <div className="space-y-3.5 text-xs sm:text-sm text-muted font-body leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-white font-medium text-sm flex items-center gap-1.5">
                <IconBolt size={14} className="text-cyan" />
                <span><strong>Mengapa harus masuk ke akun terlebih dahulu?</strong></span>
              </p>

              <ul className="space-y-2.5 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-cyan font-bold">1.</span>
                  <div>
                    <strong className="text-cyan">Collab & Tanding Real-Time:</strong> Arena Mode
                    dirancang untuk duel push-up 1v1 secara langsung dengan teman atau komunitas latihan
                    dalam ruangan yang sama maupun online.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">2.</span>
                  <div>
                    <strong className="text-yellow-400">Papan Peringkat Global:</strong> Setiap
                    kemenangan K.O. dan total repetisimu akan dicatat ke <em>Hall of Fame</em> dan
                    disinkronkan ke cloud profilmu.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-magenta font-bold">3.</span>
                  <div>
                    <strong className="text-magenta">EXP & Gelar Liga:</strong> Pertarungan arena
                    memberikan bonus EXP tinggi untuk menaikkan kasta ligamu ke Diamond dan Celestial!
                  </div>
                </li>
              </ul>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/auth?redirect=/arena"
                onClick={() => setShowArenaLoginGate(false)}
                className="flex-1 clip-corner bg-gradient-to-r from-cyan to-magenta py-3.5 font-mono text-xs font-bold text-void hover:opacity-90 transition-opacity text-center shadow-[0_0_20px_rgba(255,0,122,0.4)] flex items-center justify-center gap-2"
              >
                <span>Masuk / Buat Akun di Halaman Login</span>
                <IconBolt size={14} className="text-void" />
              </Link>

              <button
                onClick={() => setShowArenaLoginGate(false)}
                className="px-5 py-3 rounded border border-white/20 text-xs font-mono text-muted hover:text-white hover:border-white/40 transition-colors"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. AUTH MODAL */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </main>
  );
}
