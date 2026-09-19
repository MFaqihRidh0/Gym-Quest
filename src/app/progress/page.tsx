'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { calculateSummaryStats, getWorkoutHistory, getUserProfile, DEFAULT_USER_PROFILE } from '@/modules/program-engine/storage';
import type { UserProfile, WorkoutSessionLog } from '@/modules/program-engine/types';
import { UserNavButton } from '@/components/UserNavButton';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { GymQuestLogo } from '@/components/GymQuestLogo';
import { AppNavbar } from '@/components/AppNavbar';
import { useLanguage } from '@/modules/i18n';

export default function ProgressPage() {
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [history, setHistory] = useState<WorkoutSessionLog[]>([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  // Kalender Bulan
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed

  useEffect(() => {
    setProfile(getUserProfile());
    setHistory(getWorkoutHistory());
  }, []);

  const stats = calculateSummaryStats(history);

  // Helper kalender
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Minggu

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  // Set tanggal yang ada riwayat latihan (format YYYY-MM-DD)
  const workoutDates = new Set(
    history.map((log) => {
      const d = new Date(log.timestamp);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${d.getFullYear()}-${m}-${day}`;
    })
  );

  const filteredHistory = selectedDateFilter
    ? history.filter((log) => {
        const d = new Date(log.timestamp);
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${m}-${day}` === selectedDateFilter;
      })
    : history;

  return (
    <main className="min-h-screen flex flex-col bg-transparent text-primary pb-16 overflow-x-hidden">
      {/* HEADER */}
      <AppNavbar
        activePage="progress"
        subtitle={`· ${t.nav.progress}`}
        streakDays={profile.streakDays}
      />

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* TOMBOL KEMBALI KE BERANDA */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/15 hover:bg-cyan/10 hover:border-cyan/40 hover:text-cyan text-muted transition-all duration-200 text-xs font-mono tracking-wide backdrop-blur-sm shadow-sm group"
          >
            <span className="text-base group-hover:-translate-x-1 transition-transform">←</span>
            <span>{t.common.backToHome}</span>
          </Link>
        </div>

        {/* HERO TITLE & STREAK BANNER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="font-mono text-xs tracking-widest text-cyan uppercase">Analytics & History</p>
            <h1 className="mt-1 font-display text-2xl sm:text-4xl font-bold text-white">
              {t.progress.pageTitle}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {t.progress.pageSubtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/leaderboard"
              className="flex items-center gap-3 bg-gradient-to-r from-cyan/20 to-magenta/20 border border-cyan/40 rounded-xl p-3.5 sm:p-4 shrink-0 hover:border-cyan transition-colors"
            >
              <span className="text-2xl sm:text-3xl">🏆</span>
              <div>
                <div className="text-[10px] sm:text-[11px] font-mono uppercase text-cyan font-bold tracking-wider">
                  {t.home.modeLeaderboardTitle}
                </div>
                <div className="font-display text-xs sm:text-sm font-bold text-white flex items-center gap-1">
                  {t.nav.leaderboard} ▸
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-500/20 to-magenta/20 border border-yellow-500/40 rounded-xl p-3.5 sm:p-4 shrink-0 shadow-[0_0_20px_rgba(255,214,0,0.1)]">
              <span className="text-2xl sm:text-3xl">🔥</span>
              <div>
                <div className="text-[10px] sm:text-[11px] font-mono uppercase text-yellow-400 font-bold tracking-wider">
                  {t.progress.streakTitle}
                </div>
                <div className="font-display text-xl sm:text-2xl font-bold text-white">
                  {profile.streakDays} <span className="text-xs sm:text-sm font-normal text-muted">{t.progress.streakDays}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel clip-corner border-white/10 p-5">
            <span className="text-xs font-mono text-muted uppercase">{t.progress.completedSessionsTitle}</span>
            <div className="font-display text-3xl font-bold text-white mt-1">
              {stats.totalSessions}
            </div>
            <span className="text-[11px] text-cyan mt-1 block">{t.common.completed}</span>
          </div>

          <div className="glass-panel clip-corner border-white/10 p-5">
            <span className="text-xs font-mono text-muted uppercase">{t.common.duration}</span>
            <div className="font-display text-3xl font-bold text-cyan mt-1">
              {stats.totalMinutes}
            </div>
            <span className="text-[11px] text-muted mt-1 block">{t.common.minutes}</span>
          </div>

          <div className="glass-panel clip-corner border-white/10 p-5">
            <span className="text-xs font-mono text-muted uppercase">{t.progress.totalCaloriesTitle}</span>
            <div className="font-display text-3xl font-bold text-magenta mt-1">
              {stats.totalCalories}
            </div>
            <span className="text-[11px] text-muted mt-1 block">{t.common.calories}</span>
          </div>

          <div className="glass-panel clip-corner border-white/10 p-5">
            <span className="text-xs font-mono text-muted uppercase">{t.common.reps}</span>
            <div className="font-display text-3xl font-bold text-yellow-400 mt-1">
              {stats.totalReps}
            </div>
            <span className="text-[11px] text-muted mt-1 block">{t.common.reps}</span>
          </div>
        </div>

        {/* KALENDER BULANAN */}
        <div className="glass-panel clip-corner border-white/15 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-white">Kalender Latihan</h2>
              <p className="text-xs text-muted">Titik biru menandai hari kamu menyelesaikan latihan.</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-white">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-xs px-2"
                >
                  ‹
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-xs px-2"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* GRID KALENDER */}
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-muted uppercase">
              <span>Min</span>
              <span>Sen</span>
              <span>Sel</span>
              <span>Rab</span>
              <span>Kam</span>
              <span>Jum</span>
              <span>Sab</span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Empty padding days before first of month */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10 sm:h-12 rounded bg-white/[0.02]" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const monthStr = String(currentMonth + 1).padStart(2, '0');
                const dayStr = String(day).padStart(2, '0');
                const dateKey = `${currentYear}-${monthStr}-${dayStr}`;
                const hasWorkout = workoutDates.has(dateKey);
                const isSelected = selectedDateFilter === dateKey;

                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDateFilter(null);
                      } else {
                        setSelectedDateFilter(dateKey);
                      }
                    }}
                    className={`h-10 sm:h-12 rounded border flex flex-col items-center justify-center font-mono text-xs relative transition-all ${
                      isSelected
                        ? 'border-cyan bg-cyan/20 text-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)] font-bold'
                        : hasWorkout
                          ? 'border-cyan/40 bg-cyan/10 text-white hover:border-cyan'
                          : 'border-white/5 bg-white/[0.02] text-muted hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xs sm:text-sm">{day}</span>
                    {hasWorkout && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan absolute bottom-1.5 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDateFilter && (
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <span className="font-mono text-cyan">
                {selectedDateFilter}
              </span>
              <button
                onClick={() => setSelectedDateFilter(null)}
                className="text-muted hover:text-white underline"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* LOG RIWAYAT AKTIVITAS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-white">{t.progress.historySectionTitle}</h2>
            <span className="text-xs font-mono text-muted">{filteredHistory.length}</span>
          </div>

          <div className="space-y-3">
            {filteredHistory.map((item) => {
              const d = new Date(item.timestamp);
              const dateFormatted = d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="glass-panel clip-corner border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-white/20"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-white text-base">
                        {item.programTitle}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan/15 text-cyan border border-cyan/30">
                        {t.common.completed}
                      </span>
                    </div>
                    <div className="text-xs text-muted font-mono">{dateFormatted}</div>
                  </div>

                  <div className="flex items-center gap-5 text-xs font-mono">
                    <div>
                      <span className="text-muted block text-[10px]">{t.common.duration}</span>
                      <span className="text-cyan font-bold">
                        {Math.round(item.durationSeconds / 60)} {t.common.minutes}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">{t.common.calories}</span>
                      <span className="text-magenta font-bold">~{item.caloriesBurned} {t.common.calories}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">{t.common.reps}</span>
                      <span className="text-white font-bold">{item.totalRepsCompleted} {t.common.reps}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredHistory.length === 0 && (
              <div className="text-center py-12 border border-dashed border-white/15 rounded-xl space-y-3">
                <p className="text-muted text-sm">
                  {selectedDateFilter
                    ? t.progress.emptyHistoryTitle
                    : `${t.progress.emptyHistoryTitle}. ${t.progress.emptyHistorySubtitle}`}
                </p>
                <Link
                  href="/programs"
                  className="inline-block clip-corner bg-cyan px-5 py-2 text-xs font-bold text-void"
                >
                  {t.programs.startProgramButton} ▸
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
