'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { calculateSummaryStats, getWorkoutHistory, getUserProfile, DEFAULT_USER_PROFILE } from '@/modules/program-engine/storage';
import type { UserProfile, WorkoutSessionLog } from '@/modules/program-engine/types';
import { UserNavButton } from '@/components/UserNavButton';

export default function ProgressPage() {
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

  // Kumpulan tanggal latihan (Set of YYYY-MM-DD)
  const workoutDates = new Set(
    history.map((h) => {
      const d = new Date(h.timestamp);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }),
  );

  // Buat grid hari kalender bulan ini
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Minggu
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Filter riwayat jika ada tanggal kalender yang diklik
  const filteredHistory = selectedDateFilter
    ? history.filter((h) => {
        const d = new Date(h.timestamp);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}` === selectedDateFilter;
      })
    : history;

  return (
    <main className="min-h-screen flex flex-col bg-transparent text-primary pb-16">
      {/* HEADER */}
      <header className="glass-panel sticky top-3 z-20 mx-3 rounded-2xl flex items-center justify-between px-5 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.55)]">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-display text-sm tracking-wide text-white hover:text-cyan transition-colors">
            GYMQUEST <span className="text-muted">· Progress</span>
          </Link>
        </div>
        <nav className="flex items-center gap-4 text-sm font-body">
          <Link href="/programs" className="text-muted hover:text-cyan transition-colors">
            Program Latihan
          </Link>
          <Link href="/leaderboard" className="text-yellow-400 hover:text-yellow-300 transition-colors font-medium">
            Leaderboard 🏆
          </Link>
          <Link href="/arena" className="text-muted hover:text-magenta transition-colors hidden sm:inline">
            Arena Mode
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/15 hover:bg-cyan/10 hover:border-cyan/40 hover:text-cyan text-muted transition-all duration-200 text-xs font-mono tracking-wide backdrop-blur-sm shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Beranda
          </Link>
          <UserNavButton />
        </nav>
      </header>

      <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:py-12 space-y-8">
        {/* HERO TITLE & STREAK BANNER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="font-mono text-xs tracking-widest text-cyan uppercase">Riwayat & Statistik</p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-white">
              Progres Latihanmu
            </h1>
            <p className="mt-1 text-sm text-muted">
              Pantau konsistensi, streak harian, dan akumulasi kalori yang berhasil kamu bakar.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/leaderboard"
              className="flex items-center gap-3 bg-gradient-to-r from-cyan/20 to-magenta/20 border border-cyan/40 rounded-xl p-4 shrink-0 hover:border-cyan transition-colors"
            >
              <span className="text-3xl">🏆</span>
              <div>
                <div className="text-[11px] font-mono uppercase text-cyan font-bold tracking-wider">
                  5 Liga Mingguan
                </div>
                <div className="font-display text-sm font-bold text-white flex items-center gap-1">
                  Lihat Posisi ▸
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-500/20 to-magenta/20 border border-yellow-500/40 rounded-xl p-4 shrink-0 shadow-[0_0_20px_rgba(255,214,0,0.1)]">
              <span className="text-3xl">🔥</span>
              <div>
                <div className="text-[11px] font-mono uppercase text-yellow-400 font-bold tracking-wider">
                  Daily Streak
                </div>
                <div className="font-display text-2xl font-bold text-white">
                  {profile.streakDays} <span className="text-sm font-normal text-muted">Hari Beruntun</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel clip-corner border-white/10 p-5">
            <span className="text-xs font-mono text-muted uppercase">Total Sesi</span>
            <div className="font-display text-3xl font-bold text-white mt-1">
              {stats.totalSessions}
            </div>
            <span className="text-[11px] text-cyan mt-1 block">Sesi Selesai</span>
          </div>

          <div className="glass-panel clip-corner border-white/10 p-5">
            <span className="text-xs font-mono text-muted uppercase">Waktu Latihan</span>
            <div className="font-display text-3xl font-bold text-cyan mt-1">
              {stats.totalMinutes}
            </div>
            <span className="text-[11px] text-muted mt-1 block">Total Menit</span>
          </div>

          <div className="glass-panel clip-corner border-white/10 p-5">
            <span className="text-xs font-mono text-muted uppercase">Kalori Terbakar</span>
            <div className="font-display text-3xl font-bold text-magenta mt-1">
              {stats.totalCalories}
            </div>
            <span className="text-[11px] text-muted mt-1 block">Estimasi kkal</span>
          </div>

          <div className="glass-panel clip-corner border-white/10 p-5">
            <span className="text-xs font-mono text-muted uppercase">Repetisi</span>
            <div className="font-display text-3xl font-bold text-yellow-400 mt-1">
              {stats.totalReps}
            </div>
            <span className="text-[11px] text-muted mt-1 block">Total Rep Sah</span>
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
                  className="w-8 h-8 rounded border border-white/15 bg-white/5 flex items-center justify-center hover:border-cyan text-sm"
                >
                  ‹
                </button>
                <button
                  onClick={nextMonth}
                  className="w-8 h-8 rounded border border-white/15 bg-white/5 flex items-center justify-center hover:border-cyan text-sm"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* GRID KALENDER */}
          <div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-mono text-muted mb-2">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Empty padding days before first of month */}
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-10 sm:h-12 rounded bg-white/[0.02]" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const mStr = String(currentMonth + 1).padStart(2, '0');
                const dStr = String(day).padStart(2, '0');
                const dateKey = `${currentYear}-${mStr}-${dStr}`;
                const hasWorkout = workoutDates.has(dateKey);
                const isSelected = selectedDateFilter === dateKey;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDateFilter(isSelected ? null : dateKey)}
                    className={`h-10 sm:h-12 rounded flex flex-col items-center justify-center relative border transition-all ${
                      hasWorkout
                        ? 'border-cyan bg-cyan/15 text-white font-bold shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                        : isSelected
                          ? 'border-white/40 bg-white/10 text-white'
                          : 'border-white/5 bg-white/[0.02] text-muted hover:border-white/20'
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
                Menampilkan aktivitas tanggal: <strong>{selectedDateFilter}</strong>
              </span>
              <button
                onClick={() => setSelectedDateFilter(null)}
                className="text-muted hover:text-white underline"
              >
                Tampilkan Semua
              </button>
            </div>
          )}
        </div>

        {/* LOG RIWAYAT AKTIVITAS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-white">Riwayat Sesi Terakhir</h2>
            <span className="text-xs font-mono text-muted">{filteredHistory.length} Catatan</span>
          </div>

          <div className="space-y-3">
            {filteredHistory.map((item) => {
              const d = new Date(item.timestamp);
              const dateFormatted = d.toLocaleDateString('id-ID', {
                weekday: 'long',
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
                        Selesai
                      </span>
                    </div>
                    <div className="text-xs text-muted font-mono">{dateFormatted}</div>
                  </div>

                  <div className="flex items-center gap-5 text-xs font-mono">
                    <div>
                      <span className="text-muted block text-[10px]">Durasi</span>
                      <span className="text-cyan font-bold">
                        {Math.round(item.durationSeconds / 60)} Menit
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">Kalori</span>
                      <span className="text-magenta font-bold">~{item.caloriesBurned} kkal</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">Repetisi</span>
                      <span className="text-white font-bold">{item.totalRepsCompleted} Rep</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredHistory.length === 0 && (
              <div className="text-center py-12 border border-dashed border-white/15 rounded-xl space-y-3">
                <p className="text-muted text-sm">
                  {selectedDateFilter
                    ? 'Tidak ada latihan tercatat pada tanggal ini.'
                    : 'Belum ada riwayat latihan. Mulai latihan pertamamu sekarang!'}
                </p>
                <Link
                  href="/programs"
                  className="inline-block clip-corner bg-cyan px-5 py-2 text-xs font-bold text-void"
                >
                  Pilih Program Latihan ▸
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
