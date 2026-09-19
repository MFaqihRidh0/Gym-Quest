'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { DEFAULT_PROGRAMS } from '@/modules/program-engine/defaultPrograms';
import { getCustomPrograms, getUserProfile, DEFAULT_USER_PROFILE } from '@/modules/program-engine/storage';
import type { FitnessLevel, ProgramCategory, UserProfile, WorkoutProgram } from '@/modules/program-engine/types';
import { OnboardingModal } from '@/components/OnboardingModal';
import { CustomWorkoutModal } from '@/components/CustomWorkoutModal';
import { UserNavButton } from '@/components/UserNavButton';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { GymQuestLogo } from '@/components/GymQuestLogo';
import { useLanguage, getLocalizedPrograms, getLocalizedLevel } from '@/modules/i18n';
import {
  IconBolt,
  IconDumbbell,
  IconFlame,
  IconShield,
  IconStretching,
  IconGear,
  IconTrophy,
  IconTimer,
  IconTarget,
  IconPlay,
  IconCheckmark,
} from '@/components/ui/CyberIcons';

type LevelFilter = 'all' | FitnessLevel;
type TargetFilter = 'all' | ProgramCategory;
type DurationFilter = 'all' | 'quick' | 'medium' | 'long';

export default function ProgramsPage() {
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [customPrograms, setCustomPrograms] = useState<WorkoutProgram[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // 3-DIMENSIONAL FILTERS: Level -> Target -> Duration
  const [filterLevel, setFilterLevel] = useState<LevelFilter>('all');
  const [filterTarget, setFilterTarget] = useState<TargetFilter>('all');
  const [filterDuration, setFilterDuration] = useState<DurationFilter>('all');

  useEffect(() => {
    const p = getUserProfile();
    setProfile(p);
    setCustomPrograms(getCustomPrograms());

    // Munculkan onboarding otomatis jika belum pernah diisi
    if (!p.hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const localizedDefaults = useMemo(
    () => getLocalizedPrograms(DEFAULT_PROGRAMS, language),
    [language]
  );
  const allPrograms = useMemo(
    () => [...localizedDefaults, ...customPrograms],
    [localizedDefaults, customPrograms]
  );

  // LEVEL FILTER DEFINITIONS
  const levelOptions: { id: LevelFilter; label: string }[] = [
    { id: 'all', label: language === 'en' ? 'All Levels' : 'Semua Level' },
    { id: 'pemula', label: language === 'en' ? 'Beginner' : 'Pemula' },
    { id: 'menengah', label: language === 'en' ? 'Intermediate' : 'Menengah' },
    { id: 'mahir', label: language === 'en' ? 'Advanced' : 'Mahir' },
  ];

  // TARGET / GOAL FILTER DEFINITIONS WITH CUSTOM CYBER ICONS
  const targetOptions: { id: TargetFilter; label: string; icon: React.ReactNode }[] = [
    {
      id: 'all',
      label: language === 'en' ? 'All Goals' : 'Semua Target',
      icon: <IconBolt size={14} className="text-cyan" />,
    },
    {
      id: 'full_body',
      label: language === 'en' ? 'Build Muscle & Strength' : 'Bangun Otot & Kekuatan',
      icon: <IconDumbbell size={14} className="text-cyan" />,
    },
    {
      id: 'cardio',
      label: language === 'en' ? 'Burn Fat (HIIT)' : 'Bakar Lemak (HIIT)',
      icon: <IconFlame size={14} className="text-magenta" />,
    },
    {
      id: 'core',
      label: language === 'en' ? 'Core Strength' : 'Kekuatan Core',
      icon: <IconShield size={14} className="text-cyan" />,
    },
    {
      id: 'stretching',
      label: language === 'en' ? 'Mobility & Stretch' : 'Mobilitas & Peregangan',
      icon: <IconStretching size={14} className="text-cyan" />,
    },
    {
      id: 'custom',
      label: language === 'en' ? 'Custom Routines' : 'Rutinitas Mandiri',
      icon: <IconGear size={14} className="text-cyan" />,
    },
  ];

  // DURATION FILTER DEFINITIONS
  const durationOptions: { id: DurationFilter; label: string }[] = [
    { id: 'all', label: language === 'en' ? 'All Durations' : 'Semua Durasi' },
    { id: 'quick', label: language === 'en' ? '≤ 12 Mins (Quick)' : '≤ 12 Menit (Kilat)' },
    { id: 'medium', label: language === 'en' ? '14 - 16 Mins (~15m)' : '14 - 16 Menit (~15m)' },
    { id: 'long', label: language === 'en' ? '≥ 20 Mins (Intensive)' : '≥ 20 Menit (Intensif)' },
  ];

  const hasActiveFilters = filterLevel !== 'all' || filterTarget !== 'all' || filterDuration !== 'all';

  const resetFilters = () => {
    setFilterLevel('all');
    setFilterTarget('all');
    setFilterDuration('all');
  };

  // MULTI-CRITERIA SCORING & SORTING: Level -> Target -> Duration
  const sortedPrograms = useMemo(() => {
    const list = [...allPrograms];

    return list.sort((a, b) => {
      // 1. Level Match Priority (Primary)
      const aLevelMatch = filterLevel === 'all' ? 1 : a.level === filterLevel ? 2 : 0;
      const bLevelMatch = filterLevel === 'all' ? 1 : b.level === filterLevel ? 2 : 0;
      if (aLevelMatch !== bLevelMatch) {
        return bLevelMatch - aLevelMatch;
      }

      // 2. Target Match Priority (Secondary)
      const checkTarget = (prog: WorkoutProgram) => {
        if (filterTarget === 'all') return 1;
        if (filterTarget === 'full_body' && (prog.category === 'full_body' || prog.goal === 'otot')) return 2;
        if (filterTarget === 'cardio' && (prog.category === 'cardio' || prog.goal === 'kurus')) return 2;
        if (filterTarget === 'core' && prog.category === 'core') return 2;
        if (filterTarget === 'stretching' && (prog.category === 'stretching' || prog.goal === 'stamina')) return 2;
        if (filterTarget === 'custom' && prog.isCustom) return 2;
        return 0;
      };
      const aTargetMatch = checkTarget(a);
      const bTargetMatch = checkTarget(b);
      if (aTargetMatch !== bTargetMatch) {
        return bTargetMatch - aTargetMatch;
      }

      // 3. Duration Match Priority (Tertiary)
      const checkDuration = (prog: WorkoutProgram) => {
        if (filterDuration === 'all') return 1;
        if (filterDuration === 'quick') return prog.estimatedMinutes <= 12 ? 2 : 0;
        if (filterDuration === 'medium') return prog.estimatedMinutes >= 13 && prog.estimatedMinutes <= 18 ? 2 : 0;
        if (filterDuration === 'long') return prog.estimatedMinutes >= 19 ? 2 : 0;
        return 0;
      };
      const aDurationMatch = checkDuration(a);
      const bDurationMatch = checkDuration(b);
      if (aDurationMatch !== bDurationMatch) {
        return bDurationMatch - aDurationMatch;
      }

      // 4. Minute proximity tie-breaker when a specific duration filter is chosen
      if (filterDuration !== 'all') {
        const targetMin = filterDuration === 'quick' ? 12 : filterDuration === 'medium' ? 15 : 20;
        const aDiff = Math.abs(a.estimatedMinutes - targetMin);
        const bDiff = Math.abs(b.estimatedMinutes - targetMin);
        if (aDiff !== bDiff) {
          return aDiff - bDiff;
        }
      }

      return 0;
    });
  }, [allPrograms, filterLevel, filterTarget, filterDuration]);

  // HELPER TO DETERMINE IF A PROGRAM MATCHES THE ACTIVE USER FILTERS
  const getFilterMatchInfo = (prog: WorkoutProgram) => {
    if (!hasActiveFilters) return { isMatch: false, isPerfect: false };

    const levelMatch = filterLevel === 'all' || prog.level === filterLevel;
    const targetMatch =
      filterTarget === 'all' ||
      (filterTarget === 'full_body' && (prog.category === 'full_body' || prog.goal === 'otot')) ||
      (filterTarget === 'cardio' && (prog.category === 'cardio' || prog.goal === 'kurus')) ||
      (filterTarget === 'core' && prog.category === 'core') ||
      (filterTarget === 'stretching' && (prog.category === 'stretching' || prog.goal === 'stamina')) ||
      (filterTarget === 'custom' && !!prog.isCustom);

    const durationMatch =
      filterDuration === 'all' ||
      (filterDuration === 'quick' && prog.estimatedMinutes <= 12) ||
      (filterDuration === 'medium' && prog.estimatedMinutes >= 13 && prog.estimatedMinutes <= 18) ||
      (filterDuration === 'long' && prog.estimatedMinutes >= 19);

    const isPerfect =
      (filterLevel !== 'all' ? levelMatch : true) &&
      (filterTarget !== 'all' ? targetMatch : true) &&
      (filterDuration !== 'all' ? durationMatch : true);

    const isMatch = (filterLevel !== 'all' && levelMatch) || (filterTarget !== 'all' && targetMatch) || (filterDuration !== 'all' && durationMatch);

    return { isMatch, isPerfect };
  };

  return (
    <main className="min-h-screen flex flex-col bg-transparent text-primary">
      {/* HEADER */}
      <header className="glass-panel sticky top-3 z-20 mx-3 rounded-2xl flex items-center justify-between px-5 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.55)]">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <GymQuestLogo size="xs" variant="emblem" />
            <span className="font-display font-bold text-sm tracking-wide text-white group-hover:text-cyan transition-colors">
              GYMQUEST
            </span>
            <span className="text-muted text-xs font-mono">· {t.nav.programs}</span>
          </Link>
        </div>
        <nav className="flex items-center gap-4 text-sm font-body">
          <Link href="/leaderboard" className="text-yellow-400 hover:text-yellow-300 transition-colors font-medium flex items-center gap-1.5">
            <span>{t.nav.leaderboard}</span>
            <IconTrophy size={14} className="text-amber-400" />
          </Link>
          <Link href="/progress" className="text-muted hover:text-cyan transition-colors flex items-center gap-1.5">
            <IconFlame size={14} className="text-amber-400 inline" />
            <span className="text-xs">{t.progress.streakTitle}:</span>
            <span className="text-cyan font-mono font-bold text-xs">{profile.streakDays} {t.progress.streakDays}</span>
          </Link>
          <Link href="/arena" className="text-muted hover:text-magenta transition-colors hidden sm:inline">
            {t.nav.arena}
          </Link>
          <LanguageSwitcher compact />
          <UserNavButton />
        </nav>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:py-12 space-y-8">
        {/* TOMBOL KEMBALI KE BERANDA */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/15 hover:bg-cyan/10 hover:border-cyan/40 hover:text-cyan text-muted transition-all duration-200 text-xs font-mono tracking-wide backdrop-blur-sm shadow-sm group"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span>{t.common.backToHome}</span>
          </Link>
        </div>

        {/* BANNER HEADER & ACTION */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="font-mono text-xs tracking-widest text-cyan uppercase">{t.programs.homeWorkoutEngine}</p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-white">
              {t.programs.pageTitle}
            </h1>
            <p className="mt-2 text-sm text-muted max-w-xl">
              {t.programs.pageSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowCustomModal(true)}
              className="clip-corner bg-magenta px-4 py-2.5 text-xs font-bold text-void hover:shadow-[var(--glow-magenta)] transition-all flex items-center gap-1.5"
            >
              <span>+</span>
              <span>{t.programs.createCustomButton}</span>
            </button>
          </div>
        </div>

        {/* MULTI-TIER FILTER CONSOLE (Level -> Target -> Durasi) */}
        <section className="glass-panel clip-corner rounded-2xl border border-cyan/30 p-5 bg-[#0a122e]/85 shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <IconTarget size={16} className="text-cyan shrink-0" />
              <h2 className="font-display text-sm font-bold tracking-wide text-white uppercase">
                {language === 'en' ? 'Filter & Prioritize Programs' : 'Filter & Urutkan Menu Latihan'}
              </h2>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[11px] font-mono text-muted hover:text-cyan transition-colors underline underline-offset-4 self-start sm:self-auto"
              >
                {language === 'en' ? 'Reset All Filters ✕' : 'Reset Semua Filter ✕'}
              </button>
            )}
          </div>

          {/* 1. TINGKAT LEVEL */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-cyan uppercase tracking-wider font-semibold">
              1. {language === 'en' ? 'Difficulty Level:' : 'Tingkat Kemahiran:'}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {levelOptions.map((opt) => {
                const isSelected = filterLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setFilterLevel(opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                      isSelected
                        ? 'border-cyan bg-cyan/20 text-cyan font-bold shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                        : 'border-white/10 bg-white/5 text-muted hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {isSelected && <IconCheckmark size={11} className="inline mr-1 text-cyan" />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. TARGET LATIHAN */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-cyan uppercase tracking-wider font-semibold">
              2. {language === 'en' ? 'Target & Goal:' : 'Target & Tujuan Latihan:'}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {targetOptions.map((opt) => {
                const isSelected = filterTarget === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setFilterTarget(opt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                      isSelected
                        ? 'border-cyan bg-cyan/20 text-cyan font-bold shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                        : 'border-white/10 bg-white/5 text-muted hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. ESTIMASI DURASI WAKTU */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-cyan uppercase tracking-wider font-semibold">
              3. {language === 'en' ? 'Target Duration:' : 'Estimasi Durasi Waktu:'}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {durationOptions.map((opt) => {
                const isSelected = filterDuration === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setFilterDuration(opt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                      isSelected
                        ? 'border-cyan bg-cyan/20 text-cyan font-bold shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                        : 'border-white/10 bg-white/5 text-muted hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <IconTimer size={12} className={isSelected ? 'text-cyan' : 'text-muted'} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STATUS NOTIFICATION FOOTER */}
          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
              <span>
                {language === 'en'
                  ? `Showing ${sortedPrograms.length} programs · Prioritized by: Level ▸ Target ▸ Minutes`
                  : `Menampilkan ${sortedPrograms.length} menu latihan · Diurutkan teratas: Level ▸ Target ▸ Menit`}
              </span>
            </div>
            {hasActiveFilters && (
              <span className="text-cyan font-medium">
                {language === 'en'
                  ? 'Active filter matches floating to the top ⬆'
                  : 'Hasil paling cocok dimunculkan di baris paling atas ⬆'}
              </span>
            )}
          </div>
        </section>

        {/* DAFTAR PROGRAM KARTU (HASIL FILTER TERTINGGI DIMUNCULKAN DI PALING ATAS) */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sortedPrograms.map((program, idx) => {
            const isCustom = !!program.isCustom;
            const { isMatch, isPerfect } = getFilterMatchInfo(program);

            return (
              <article
                key={program.id}
                className={`glass-panel clip-corner flex flex-col justify-between p-6 border transition-all duration-200 hover:-translate-y-1 relative ${
                  isPerfect
                    ? 'border-cyan bg-cyan/[0.08] shadow-[0_0_25px_rgba(0,229,255,0.22)]'
                    : isMatch
                      ? 'border-cyan/50 bg-white/[0.03] shadow-[0_0_15px_rgba(0,229,255,0.1)]'
                      : isCustom
                        ? 'border-magenta/40 hover:border-magenta shadow-[0_0_20px_rgba(255,61,154,0.08)]'
                        : 'border-white/10 hover:border-cyan/50 shadow-[0_0_20px_rgba(0,229,255,0.05)]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider ${
                          isCustom
                            ? 'bg-magenta/20 text-magenta border border-magenta/40'
                            : 'bg-cyan/15 text-cyan border border-cyan/30'
                        }`}
                      >
                        {program.badge}
                      </span>
                      {isPerfect && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan text-void font-mono font-bold text-[10px] uppercase shadow-[var(--glow-cyan)]">
                          <IconTarget size={11} className="text-void" />
                          <span>{language === 'en' ? 'Exact Match' : 'Paling Sesuai'}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-muted flex items-center gap-1 shrink-0">
                      <IconTimer size={12} className="text-muted inline" />
                      <span>{program.estimatedMinutes}m</span>
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-white mb-2">
                    {program.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed line-clamp-3 mb-4">
                    {program.description}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted">
                    <span className="flex items-center gap-1">
                      <IconBolt size={11} className="text-cyan inline" />
                      <span>{program.exercises.length} {t.programs.exerciseCount}</span>
                    </span>
                    <span className="capitalize text-cyan">{getLocalizedLevel(program.level, language)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/programs/${program.id}`}
                      className="clip-corner border border-white/15 bg-white/5 py-2 text-center text-xs font-medium text-white hover:border-cyan hover:text-cyan transition-colors"
                    >
                      {t.programs.detail}
                    </Link>
                    <Link
                      href={`/workout?programId=${program.id}`}
                      className={`clip-corner py-2 text-center text-xs font-bold text-void transition-shadow flex items-center justify-center gap-1 ${
                        isCustom
                          ? 'bg-magenta hover:shadow-[var(--glow-magenta)]'
                          : 'bg-cyan hover:shadow-[var(--glow-cyan)]'
                      }`}
                    >
                      <span>{t.common.start}</span>
                      <IconPlay size={10} className="fill-current" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {sortedPrograms.length === 0 && (
          <div className="text-center py-16 border border-dashed border-white/15 rounded-xl">
            <p className="text-muted text-sm">{t.programs.emptyCustom}</p>
            {filterTarget === 'custom' && (
              <button
                onClick={() => setShowCustomModal(true)}
                className="mt-4 clip-corner bg-magenta px-5 py-2.5 text-xs font-bold text-void"
              >
                + {t.programs.createCustomButton}
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      <OnboardingModal
        initialProfile={profile}
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={(newProfile) => setProfile(newProfile)}
      />

      <CustomWorkoutModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSaved={(newProg) => setCustomPrograms([newProg, ...customPrograms])}
      />
    </main>
  );
}
