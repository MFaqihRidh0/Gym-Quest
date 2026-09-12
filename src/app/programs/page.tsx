'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DEFAULT_PROGRAMS, getRecommendedProgram } from '@/modules/program-engine/defaultPrograms';
import { getCustomPrograms, getUserProfile, DEFAULT_USER_PROFILE } from '@/modules/program-engine/storage';
import type { ProgramCategory, UserProfile, WorkoutProgram } from '@/modules/program-engine/types';
import { OnboardingModal } from '@/components/OnboardingModal';
import { CustomWorkoutModal } from '@/components/CustomWorkoutModal';
import { UserNavButton } from '@/components/UserNavButton';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage, getLocalizedPrograms, getLocalizedProgram, getLocalizedLevel } from '@/modules/i18n';

export default function ProgramsPage() {
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [customPrograms, setCustomPrograms] = useState<WorkoutProgram[]>([]);
  const [activeCategory, setActiveCategory] = useState<ProgramCategory | 'all'>('all');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  const categories = [
    { id: 'all' as const, label: t.programs.catAll, icon: '⚡' },
    { id: 'full_body' as const, label: t.programs.catFullBody, icon: '🏋️' },
    { id: 'cardio' as const, label: t.programs.catCardio, icon: '🔥' },
    { id: 'core' as const, label: t.programs.catCore, icon: '🛡️' },
    { id: 'stretching' as const, label: t.programs.catStretching, icon: '🧘' },
    { id: 'custom' as const, label: t.programs.catCustom, icon: '⚙️' },
  ];

  useEffect(() => {
    const p = getUserProfile();
    setProfile(p);
    setCustomPrograms(getCustomPrograms());

    // Munculkan onboarding otomatis jika belum pernah diisi
    if (!p.hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const localizedDefaults = getLocalizedPrograms(DEFAULT_PROGRAMS, language);
  const allPrograms = [...localizedDefaults, ...customPrograms];
  const filteredPrograms =
    activeCategory === 'all'
      ? allPrograms
      : allPrograms.filter((p) => p.category === activeCategory);

  const recommendedRaw = getRecommendedProgram(profile.level, profile.goal, profile.targetDurationMinutes);
  const recommended = recommendedRaw ? getLocalizedProgram(recommendedRaw, language) : null;

  return (
    <main className="min-h-screen flex flex-col bg-transparent text-primary">
      {/* HEADER */}
      <header className="glass-panel sticky top-3 z-20 mx-3 rounded-2xl flex items-center justify-between px-5 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.55)]">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-display text-sm tracking-wide text-white hover:text-cyan transition-colors">
            GYMQUEST <span className="text-muted">· {t.nav.programs}</span>
          </Link>
        </div>
        <nav className="flex items-center gap-4 text-sm font-body">
          <Link href="/leaderboard" className="text-yellow-400 hover:text-yellow-300 transition-colors font-medium">
            {t.nav.leaderboard} 🏆
          </Link>
          <Link href="/progress" className="text-muted hover:text-cyan transition-colors flex items-center gap-1.5">
            <span>🔥 {t.progress.streakTitle}:</span>
            <span className="text-cyan font-mono font-bold">{profile.streakDays} {t.progress.streakDays}</span>
          </Link>
          <Link href="/arena" className="text-muted hover:text-magenta transition-colors hidden sm:inline">
            {t.nav.arena}
          </Link>
          <LanguageSwitcher compact />
          <UserNavButton />
        </nav>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:py-12 space-y-8">
        {/* TOMBOL KEMBALI KE BERANDA (DI BODY DENGAN TATA LETAK PAS) */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/15 hover:bg-cyan/10 hover:border-cyan/40 hover:text-cyan text-muted transition-all duration-200 text-xs font-mono tracking-wide backdrop-blur-sm shadow-sm group"
          >
            <span className="text-base group-hover:-translate-x-1 transition-transform">←</span>
            <span>{t.common.backToHome}</span>
          </Link>
        </div>

        {/* BANNER HEADER & PROFILE RECAP */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="font-mono text-xs tracking-widest text-cyan uppercase">{t.programs.homeWorkoutEngine}</p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold">
              {t.programs.pageTitle}
            </h1>
            <p className="mt-2 text-sm text-muted max-w-xl">
              {t.programs.pageSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowOnboarding(true)}
              className="clip-corner border border-cyan/40 bg-cyan/10 px-3.5 py-2 text-xs font-mono text-cyan hover:bg-cyan/20 transition-all flex items-center gap-1.5"
            >
              <span>⚙</span> {t.common.level}: <strong className="uppercase">{getLocalizedLevel(profile.level, language)}</strong>
            </button>
            <button
              onClick={() => setShowCustomModal(true)}
              className="clip-corner bg-magenta px-4 py-2 text-xs font-bold text-void hover:shadow-[var(--glow-magenta)] transition-all"
            >
              + {t.programs.createCustomButton}
            </button>
          </div>
        </div>

        {/* REKOMENDASI UNTUK PENGGUNA */}
        {recommended && (
          <section className="relative overflow-hidden rounded-xl border border-cyan/40 bg-gradient-to-r from-cyan/15 via-void to-magenta/10 p-6 shadow-[0_0_30px_rgba(0,229,255,0.1)]">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan/40 bg-cyan/20 px-3 py-1 text-[11px] font-mono text-cyan">
                  <span>★ {t.programs.recommendedBadge}</span>
                  <span>·</span>
                  <span className="uppercase">{recommended.badge}</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-white">{recommended.title}</h2>
                <p className="text-sm text-muted max-w-2xl">{recommended.description}</p>
                <div className="flex items-center gap-4 text-xs font-mono text-muted pt-1">
                  <span>⏱ {recommended.estimatedMinutes} {t.common.minutes}</span>
                  <span>·</span>
                  <span>⚡ {recommended.exercises.length} {t.programs.exerciseCount}</span>
                  <span>·</span>
                  <span className="capitalize text-cyan">{t.common.level}: {getLocalizedLevel(recommended.level, language)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/workout?programId=${recommended.id}`}
                  className="clip-corner bg-cyan px-5 py-2.5 font-body text-xs font-bold text-void hover:shadow-[var(--glow-cyan)] transition-shadow"
                >
                  {t.programs.startProgramButton} ▸
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* KATEGORI FILTER */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-mono transition-all shrink-0 ${
                  isActive
                    ? 'border-cyan bg-cyan/15 text-cyan shadow-[0_0_12px_rgba(0,229,255,0.25)] font-bold'
                    : 'border-white/10 bg-white/5 text-muted hover:border-white/20 hover:text-white'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* DAFTAR PROGRAM KARTU */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map((program) => {
            const isCustom = !!program.isCustom;
            return (
              <article
                key={program.id}
                className={`glass-panel clip-corner flex flex-col justify-between p-6 border transition-all duration-200 hover:-translate-y-1 ${
                  isCustom
                    ? 'border-magenta/40 hover:border-magenta shadow-[0_0_20px_rgba(255,61,154,0.08)]'
                    : 'border-white/10 hover:border-cyan/50 shadow-[0_0_20px_rgba(0,229,255,0.05)]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider ${
                        isCustom
                          ? 'bg-magenta/20 text-magenta border border-magenta/40'
                          : 'bg-cyan/15 text-cyan border border-cyan/30'
                      }`}
                    >
                      {program.badge}
                    </span>
                    <span className="text-xs font-mono text-muted">
                      ⏱ {program.estimatedMinutes}m
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
                    <span>{program.exercises.length} {t.programs.exerciseCount}</span>
                    <span className="capitalize">{getLocalizedLevel(program.level, language)}</span>
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
                      className={`clip-corner py-2 text-center text-xs font-bold text-void transition-shadow ${
                        isCustom
                          ? 'bg-magenta hover:shadow-[var(--glow-magenta)]'
                          : 'bg-cyan hover:shadow-[var(--glow-cyan)]'
                      }`}
                    >
                      {t.common.start} ▸
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filteredPrograms.length === 0 && (
          <div className="text-center py-16 border border-dashed border-white/15 rounded-xl">
            <p className="text-muted text-sm">{t.programs.emptyCustom}</p>
            {activeCategory === 'custom' && (
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
