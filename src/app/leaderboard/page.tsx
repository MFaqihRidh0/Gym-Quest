'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  addUserExp,
  dismissEvaluationResult,
  getWeeklySeasonState,
} from '@/modules/gamification/leaderboardStorage';
import {
  LEAGUES_CONFIG,
  LEAGUE_TIERS_ORDER,
  getNextLeague,
  getPreviousLeague,
  getRankZone,
} from '@/modules/gamification/leagues';
import type {
  LeaderboardCompetitor,
  LeagueTier,
  SeasonEvaluationResult,
  WeeklySeasonState,
} from '@/modules/gamification/types';
import { soundEngine } from '@/modules/game-engine/audio';
import { UserNavButton } from '@/components/UserNavButton';
import {
  IconLeagueBadge,
  IconTrophy,
  IconCrown,
  IconBolt,
  IconFlame,
} from '@/components/ui/CyberIcons';

export default function LeaderboardPage() {
  const [seasonState, setSeasonState] = useState<WeeklySeasonState | null>(null);
  const [selectedLeagueTab, setSelectedLeagueTab] = useState<LeagueTier>('iron');
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    percentRemaining: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, percentRemaining: 100 });

  const [activeEvaluation, setActiveEvaluation] = useState<SeasonEvaluationResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load state on mount
  useEffect(() => {
    const state = getWeeklySeasonState();
    setSeasonState(state);
    setSelectedLeagueTab(state.leagueId);
    if (state.lastEvaluation) {
      setActiveEvaluation(state.lastEvaluation);
    }
  }, []);

  // Real-time 7-Day Countdown Timer
  useEffect(() => {
    if (!seasonState) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, seasonState.seasonEndDate - now);
      const totalDuration = seasonState.seasonEndDate - seasonState.seasonStartDate;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      const percentRemaining = Math.max(0, Math.min(100, (diff / totalDuration) * 100));

      setTimeLeft({ days, hours, minutes, seconds, percentRemaining });

      // Jika waktu habis saat user sedang membuka halaman, reload state
      if (diff <= 0) {
        const refreshed = getWeeklySeasonState();
        setSeasonState(refreshed);
        if (refreshed.lastEvaluation) {
          setActiveEvaluation(refreshed.lastEvaluation);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [seasonState?.seasonEndDate, seasonState?.seasonStartDate]);

  // Posisi user dalam bracket
  const userRankIndex = useMemo(() => {
    if (!seasonState) return -1;
    return seasonState.competitors.findIndex((c) => c.isUser);
  }, [seasonState]);

  const userCompetitor: LeaderboardCompetitor | null = useMemo(() => {
    if (!seasonState || userRankIndex < 0) return null;
    return seasonState.competitors[userRankIndex];
  }, [seasonState, userRankIndex]);

  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : 11;
  const userZone = getRankZone(userRank);

  // Simulasi tambah EXP untuk uji coba langsung interaksi ranking
  const handleAddDemoExp = (amount: number) => {
    soundEngine.playPoint();
    const result = addUserExp(amount, 'demo_boost');
    setSeasonState(result.state);
    setToastMessage(`+${amount} EXP Berhasil ditambahkan! Posisi kamu kini Rank #${result.newRank}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCloseEvaluationModal = () => {
    soundEngine.playLevelUp();
    dismissEvaluationResult();
    setActiveEvaluation(null);
  };

  if (!seasonState) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-transparent text-primary">
        <p className="font-mono text-sm text-muted animate-pulse">Memuat data liga mingguan…</p>
      </main>
    );
  }

  const currentLeagueConfig = LEAGUES_CONFIG[seasonState.leagueId];
  const viewedLeagueConfig = LEAGUES_CONFIG[selectedLeagueTab];
  const nextTier = getNextLeague(seasonState.leagueId);
  const prevTier = getPreviousLeague(seasonState.leagueId);

  // Hitung selisih EXP ke zona aman atau zona promosi
  const rank1Exp = seasonState.competitors[0]?.weeklyExp || 0;
  const rank3Exp = seasonState.competitors[2]?.weeklyExp || 0;
  const rank8Exp = seasonState.competitors[7]?.weeklyExp || 0;

  return (
    <main className="min-h-screen flex flex-col bg-transparent text-primary pb-20">
      {/* HEADER NAV */}
      <header className="glass-panel sticky top-3 z-20 mx-3 rounded-2xl flex items-center justify-between px-5 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.55)]">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-display text-sm tracking-wide text-white hover:text-cyan transition-colors"
          >
            GYMQUEST <span className="text-muted">· Leaderboard</span>
          </Link>
        </div>
        <nav className="flex items-center gap-4 text-sm font-body">
          <Link href="/programs" className="text-muted hover:text-cyan transition-colors">
            Program Latihan
          </Link>
          <Link href="/progress" className="text-muted hover:text-cyan transition-colors">
            Progres
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

      {/* TOAST NOTIFIKASI EXP */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-cyan text-void font-bold font-mono text-xs px-5 py-2.5 rounded-full shadow-[0_0_25px_rgba(0,229,255,0.6)] animate-bounce">
          ⚡ {toastMessage}
        </div>
      )}

      <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:py-10 space-y-8">
        {/* HERO TITLE & SEASON COUNTDOWN BANNER */}
        <div className="relative overflow-hidden glass-panel clip-corner border-white/15 p-6 sm:p-8 bg-gradient-to-br from-[#0c1433] via-[#070c1e] to-[#0f172a]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase font-bold tracking-wider bg-cyan/15 text-cyan border border-cyan/30">
                  Musim #{seasonState.seasonNumber}
                </span>
                <span className="text-xs text-muted font-mono">Siklus 7 Hari</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Klasemen Liga {currentLeagueConfig.name} {currentLeagueConfig.badgeIcon}
              </h1>
              <p className="text-sm text-muted">
                Tingkatkan terus perolehan EXP mingguanmu dari program latihan dan tantangan fisik.
                3 teratas akan naik kasta, 5 bertahan, dan 3 terbawah turun kasta di akhir minggu!
              </p>
            </div>

            {/* COUNTDOWN COCKPIT */}
            <div className="bg-void/80 border border-cyan/40 rounded-xl p-4 sm:p-5 shrink-0 shadow-[0_0_30px_rgba(0,229,255,0.15)] space-y-3 min-w-[280px]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan font-bold tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan animate-ping" />
                  SISA WAKTU MUSIM
                </span>
                <span className="text-muted">7 Hari</span>
              </div>

              {/* DIGITS */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="font-display text-2xl sm:text-3xl font-bold text-white">
                    {timeLeft.days}
                  </div>
                  <div className="text-[10px] font-mono text-muted uppercase">Hari</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="font-display text-2xl sm:text-3xl font-bold text-white">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-mono text-muted uppercase">Jam</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="font-display text-2xl sm:text-3xl font-bold text-white">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-mono text-muted uppercase">Mnt</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="font-display text-2xl sm:text-3xl font-bold text-cyan">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-mono text-muted uppercase">Dtk</div>
                </div>
              </div>

              {/* PROGRESS BAR WAKTU */}
              <div className="space-y-1">
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan to-magenta transition-all duration-1000"
                    style={{ width: `${timeLeft.percentRemaining}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-muted">
                  <span>Mulai Musim</span>
                  <span>Evaluasi Kasta</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5 LEAGUES SHOWCASE TABS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted">
              Hirarki 5 Tingkat Liga
            </h2>
            <span className="text-[11px] font-mono text-cyan">
              Kamu berada di:{' '}
              <strong className="text-white">{currentLeagueConfig.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            {LEAGUE_TIERS_ORDER.map((tierId) => {
              const tier = LEAGUES_CONFIG[tierId];
              const isCurrent = seasonState.leagueId === tierId;
              const isSelected = selectedLeagueTab === tierId;

              return (
                <button
                  key={tierId}
                  onClick={() => {
                    setSelectedLeagueTab(tierId);
                    soundEngine.playCountdownTick();
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all relative ${
                    isSelected
                      ? 'border-cyan bg-cyan/15 shadow-[0_0_20px_rgba(0,229,255,0.25)]'
                      : isCurrent
                        ? 'border-white/30 bg-white/5'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-2 px-2 py-0.2 bg-cyan text-void text-[9px] font-mono font-bold rounded-full uppercase tracking-wider">
                      Liga Kamu
                    </span>
                  )}
                  <div className="my-1 flex items-center justify-center">
                    <IconLeagueBadge tier={tierId} size={32} />
                  </div>
                  <span className="font-display text-xs sm:text-sm font-bold text-white line-clamp-1">
                    {tier.name}
                  </span>
                  <span className="text-[10px] font-mono text-muted mt-0.5">Tier {tier.order}</span>
                </button>
              );
            })}
          </div>

          {/* DETAIL KASTA YANG SEDANG DIINSPEKSI */}
          <div className="glass-panel clip-corner border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-void/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <IconLeagueBadge tier={selectedLeagueTab} size={28} />
                <h3 className="font-display font-bold text-white text-base">
                  {viewedLeagueConfig.name} — {viewedLeagueConfig.title}
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${viewedLeagueConfig.badgeColor}`}
                >
                  Tier {viewedLeagueConfig.order} / 5
                </span>
              </div>
              <p className="text-xs text-muted max-w-2xl">{viewedLeagueConfig.description}</p>
              <p className="text-[11px] text-cyan/80 italic">&ldquo;{viewedLeagueConfig.lore}&rdquo;</p>
            </div>

            <div className="text-right sm:border-l sm:border-white/10 sm:pl-5 shrink-0">
              <div className="text-[10px] font-mono text-muted">Standar Acuan EXP</div>
              <div className="font-display text-xl font-bold text-yellow-400">
                ~{viewedLeagueConfig.minExpBenchmark} EXP
              </div>
            </div>
          </div>
        </div>

        {/* CURRENT USER STANDING HERO CARD */}
        {userCompetitor && (
          <div className="glass-panel clip-corner border-cyan/50 p-5 sm:p-6 bg-gradient-to-r from-cyan/10 via-transparent to-magenta/10 shadow-[0_0_30px_rgba(0,229,255,0.1)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan/20 border-2 border-cyan flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                  {userCompetitor.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-lg text-white">
                      {userCompetitor.username}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan text-void">
                      KAMU
                    </span>
                  </div>
                  <div className="text-xs text-muted flex items-center gap-3 mt-0.5">
                    <span>Level {userCompetitor.level}</span>
                    <span>•</span>
                    <span className="text-yellow-400">🔥 Streak {userCompetitor.streakDays} Hari</span>
                  </div>
                </div>
              </div>

              {/* USER RANK & ZONE STATUS */}
              <div className="flex items-center gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
                <div className="text-right">
                  <div className="text-[10px] font-mono text-muted uppercase">Peringkat Bracket</div>
                  <div className="font-display text-3xl font-extrabold text-white">
                    #{userRank}{' '}
                    <span className="text-sm font-normal text-muted">/ 11</span>
                  </div>
                </div>

                <div className="h-10 w-px bg-white/15" />

                <div>
                  <div className="text-[10px] font-mono text-muted uppercase">Status Musim</div>
                  {userZone === 'promotion' && (
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 rounded-md">
                      ⬆ PROMOSI KE {LEAGUES_CONFIG[nextTier].name.toUpperCase()}
                    </span>
                  )}
                  {userZone === 'safe' && (
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-cyan-400 bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-1 rounded-md">
                      ⬌ BERTAHAN DI {currentLeagueConfig.name.toUpperCase()}
                    </span>
                  )}
                  {userZone === 'demotion' && (
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-rose-400 bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 rounded-md">
                      ⬇ DEGRADASI KE {LEAGUES_CONFIG[prevTier].name.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* EXP INSIGHTS & ACTIONS */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-muted font-mono">
                Akumulasi Minggu Ini:{' '}
                <strong className="text-cyan font-bold">{userCompetitor.weeklyExp} EXP</strong>
                {userRank > 3 && (
                  <span className="ml-2 text-yellow-400">
                    (Butuh +{Math.max(10, rank3Exp - userCompetitor.weeklyExp + 10)} EXP untuk masuk Zona Promosi)
                  </span>
                )}
                {userRank <= 3 && (
                  <span className="ml-2 text-emerald-400">
                    (Aman di Zona Promosi! Selisih +{userCompetitor.weeklyExp - rank8Exp} EXP di atas zona degradasi)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/programs"
                  className="clip-corner bg-gradient-to-r from-cyan to-magenta px-4 py-2 font-mono text-xs font-bold text-void hover:opacity-90 transition-opacity"
                >
                  Latihan Tambah EXP ▸
                </Link>
                {/* Tombol simulasi EXP untuk kemudahan verifikasi langsung */}
                <button
                  onClick={() => handleAddDemoExp(150)}
                  title="Klik untuk mensimulasikan perolehan +150 EXP sesi latihan dan melihat perubahan posisi ranking seketika"
                  className="px-3 py-2 rounded border border-white/20 bg-white/5 hover:border-cyan text-white text-[11px] font-mono transition-colors"
                >
                  +150 EXP (Test)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ATURAN LIGA (7 HARI: 3 PROMOSI, 5 BERTAHAN, 3 DEGRADASI) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-3">
            <span className="text-2xl">🟢</span>
            <div className="text-xs">
              <div className="font-bold text-emerald-400 uppercase font-mono tracking-wider">
                Rank 1 — 3: Promosi
              </div>
              <p className="text-muted mt-0.5">
                3 atlet teratas dengan EXP tertinggi akan otomatis naik ke tingkat liga berikutnya di akhir 7 hari.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 flex items-start gap-3">
            <span className="text-2xl">🟡</span>
            <div className="text-xs">
              <div className="font-bold text-cyan-400 uppercase font-mono tracking-wider">
                Rank 4 — 8: Bertahan
              </div>
              <p className="text-muted mt-0.5">
                5 atlet di posisi menengah berhasil mengamankan posisi dan menetap di liga saat ini.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3">
            <span className="text-2xl">🔴</span>
            <div className="text-xs">
              <div className="font-bold text-rose-400 uppercase font-mono tracking-wider">
                Rank 9 — 11: Degradasi
              </div>
              <p className="text-muted mt-0.5">
                3 atlet terbawah akan terdegradasi turun 1 tingkat liga (kecuali di kasta Iron Initiate).
              </p>
            </div>
          </div>
        </div>

        {/* TABEL BRACKET 11 KONTESTAN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Papan Peringkat Bracket Minggu Ini
              </h2>
              <p className="text-xs text-muted">
                11 kontestan di {currentLeagueConfig.name} yang bersaing dalam siklus 7 hari aktif.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan">11 Kontestan</span>
          </div>

          <div className="space-y-2">
            {seasonState.competitors.map((competitor, idx) => {
              const rank = idx + 1;
              const zone = getRankZone(rank);
              const isFirstOfZone = rank === 1 || rank === 4 || rank === 9;

              // Medali & Indikator
              let medal = null;
              if (rank === 1) medal = '🥇';
              else if (rank === 2) medal = '🥈';
              else if (rank === 3) medal = '🥉';

              const expWidthPercent = rank1Exp > 0 ? (competitor.weeklyExp / rank1Exp) * 100 : 0;

              return (
                <React.Fragment key={competitor.id}>
                  {/* ZONE DIVIDER HEADER */}
                  {isFirstOfZone && (
                    <div
                      className={`pt-3 pb-1 flex items-center gap-2 font-mono text-xs uppercase font-bold tracking-wider ${
                        zone === 'promotion'
                          ? 'text-emerald-400'
                          : zone === 'safe'
                            ? 'text-cyan-400'
                            : 'text-rose-400'
                      }`}
                    >
                      <span>
                        {zone === 'promotion' && `⬆ ZONA PROMOSI (Naik ke ${LEAGUES_CONFIG[nextTier].name})`}
                        {zone === 'safe' && `⬌ ZONA BERTAHAN (Menetap di ${currentLeagueConfig.name})`}
                        {zone === 'demotion' && `⬇ ZONA DEGRADASI (Turun ke ${LEAGUES_CONFIG[prevTier].name})`}
                      </span>
                      <div
                        className={`flex-1 h-px ${
                          zone === 'promotion'
                            ? 'bg-emerald-500/30'
                            : zone === 'safe'
                              ? 'bg-cyan-500/30'
                              : 'bg-rose-500/30'
                        }`}
                      />
                    </div>
                  )}

                  {/* COMPETITOR CARD ROW */}
                  <div
                    className={`glass-panel clip-corner p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all ${
                      competitor.isUser
                        ? 'border-2 border-cyan bg-cyan/15 shadow-[0_0_20px_rgba(0,229,255,0.25)] scale-[1.01]'
                        : zone === 'promotion'
                          ? 'border-emerald-500/30 bg-emerald-500/[0.03] hover:border-emerald-500/50'
                          : zone === 'safe'
                            ? 'border-white/10 bg-white/[0.02] hover:border-white/20'
                            : 'border-rose-500/30 bg-rose-500/[0.03] hover:border-rose-500/50'
                    }`}
                  >
                    {/* RANK NUMBER & AVATAR */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-[140px] sm:min-w-[220px]">
                      <div className="w-8 text-center font-display font-bold text-base sm:text-lg flex items-center justify-center">
                        {medal ? (
                          <span className="text-xl sm:text-2xl">{medal}</span>
                        ) : (
                          <span
                            className={
                              zone === 'demotion'
                                ? 'text-rose-400'
                                : 'text-muted'
                            }
                          >
                            #{rank}
                          </span>
                        )}
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0">
                        {competitor.avatar}
                      </div>

                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-display text-sm font-bold truncate ${
                              competitor.isUser ? 'text-cyan' : 'text-white'
                            }`}
                          >
                            {competitor.username}
                          </span>
                          {competitor.isUser && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan text-void font-bold uppercase">
                              Kamu
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted truncate">
                          Lv.{competitor.level} • {competitor.title}
                        </div>
                      </div>
                    </div>

                    {/* EXP COMPARISON PROGRESS BAR (DESKTOP) */}
                    <div className="hidden md:flex flex-1 items-center px-4">
                      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            competitor.isUser
                              ? 'bg-cyan shadow-[0_0_10px_#00e5ff]'
                              : zone === 'promotion'
                                ? 'bg-emerald-400'
                                : zone === 'safe'
                                  ? 'bg-slate-400'
                                  : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.max(5, expWidthPercent)}%` }}
                        />
                      </div>
                    </div>

                    {/* STATUS PILL & EXP DISPLAY */}
                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div className="hidden sm:block">
                        <div className="text-[10px] font-mono text-muted">Streak</div>
                        <div className="text-xs font-mono text-yellow-400 font-bold">
                          🔥 {competitor.streakDays}h
                        </div>
                      </div>

                      <div className="min-w-[90px]">
                        <div className="font-display font-bold text-sm sm:text-base text-white">
                          {competitor.weeklyExp.toLocaleString('id-ID')}{' '}
                          <span className="text-[10px] font-mono text-cyan">EXP</span>
                        </div>
                        <div className="text-[10px] font-mono">
                          {zone === 'promotion' && (
                            <span className="text-emerald-400 font-semibold">⬆ Promosi</span>
                          )}
                          {zone === 'safe' && (
                            <span className="text-muted">⬌ Bertahan</span>
                          )}
                          {zone === 'demotion' && (
                            <span className="text-rose-400 font-semibold">⬇ Degradasi</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* HALL OF FAME: ARENA MODE & 1v1 PUSH-UP BATTLE */}
        <div className="space-y-4 pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⚔️</span>
                <h2 className="font-display text-xl font-bold text-white">
                  Hall of Fame Arena Mode & 1v1 Battle
                </h2>
              </div>
              <p className="text-xs text-muted">
                Pencapaian rekor tertinggi mini-game dan duel adu push-up komunitas GymQuest.
              </p>
            </div>
            <Link
              href="/arena/battle"
              className="clip-corner bg-gradient-to-r from-magenta to-cyan px-4 py-2 font-mono text-xs font-bold text-white hover:opacity-90 transition-opacity shrink-0"
            >
              Tanding 1v1 Battle Sekarang ⚔️
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Push-Up Battle */}
            <div className="glass-panel clip-corner border-2 border-magenta/40 p-4 bg-gradient-to-b from-magenta/10 to-transparent space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🥊</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-magenta/20 text-magenta font-bold border border-magenta/40">
                  2-Player Battle
                </span>
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white">1v1 Push-Up Battle</h3>
                <p className="text-xs text-muted">Adu banyak push-up split-screen KO.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="text-[10px] text-muted">Rekor Tertinggi</div>
                  <div className="font-bold text-white">CyberSpartan</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-magenta font-bold">28 KO WINS</div>
                  <div className="text-muted text-[10px]">34 Reps/Match</div>
                </div>
              </div>
              <Link
                href="/arena/battle"
                className="block w-full text-center clip-corner border border-magenta/50 bg-magenta/15 py-2 font-mono text-xs font-bold text-magenta hover:bg-magenta/25 transition-colors"
              >
                Mulai Adu Push-Up ▸
              </Link>
            </div>

            {/* 2. Kuda Poni */}
            <div className="glass-panel clip-corner border border-cyan/40 p-4 bg-gradient-to-b from-cyan/10 to-transparent space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🐎</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan/20 text-cyan font-bold border border-cyan/40">
                  Solo Push-up
                </span>
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white">Kuda Poni Terbang</h3>
                <p className="text-xs text-muted">Kendali vertikal via repetisi push-up.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="text-[10px] text-muted">Top Score</div>
                  <div className="font-bold text-white">AeroPhoenix</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-cyan font-bold">1,840 PTS</div>
                  <div className="text-muted text-[10px]">26 Obstacles</div>
                </div>
              </div>
              <Link
                href="/arena"
                className="block w-full text-center clip-corner border border-cyan/40 bg-cyan/10 py-2 font-mono text-xs font-semibold text-cyan hover:bg-cyan/20 transition-colors"
              >
                Mainkan Solo ▸
              </Link>
            </div>

            {/* 3. Kangguru */}
            <div className="glass-panel clip-corner border border-yellow-400/40 p-4 bg-gradient-to-b from-yellow-500/10 to-transparent space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🦘</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-400 font-bold border border-yellow-400/40">
                  Squat & Barbell
                </span>
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white">Kangguru Angkat Barbel</h3>
                <p className="text-xs text-muted">Melompati rintangan dengan angkat tangan.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="text-[10px] text-muted">Top Score</div>
                  <div className="font-bold text-white">TitanForge</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-yellow-400 font-bold">2,450 PTS</div>
                  <div className="text-muted text-[10px]">35 Trapezius</div>
                </div>
              </div>
              <Link
                href="/arena"
                className="block w-full text-center clip-corner border border-yellow-400/40 bg-yellow-400/10 py-2 font-mono text-xs font-semibold text-yellow-400 hover:bg-yellow-400/20 transition-colors"
              >
                Mainkan Solo ▸
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL EVALUASI AKHIR MUSIM 7 HARI (JIKA BARU SELESAI SIKLUS) */}
      {activeEvaluation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-5 animate-fade-in">
          <div className="glass-panel clip-corner w-full max-w-md border-cyan p-6 sm:p-8 text-center bg-void/95 space-y-6 shadow-[0_0_60px_rgba(0,229,255,0.3)]">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-4xl border border-cyan/40 bg-cyan/15">
              {activeEvaluation.outcome === 'promoted' && '🏆'}
              {activeEvaluation.outcome === 'retained' && '🛡️'}
              {activeEvaluation.outcome === 'relegated' && '⚡'}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono tracking-widest text-cyan uppercase font-bold">
                Evaluasi Musim #{activeEvaluation.seasonNumber} Selesai
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {activeEvaluation.outcome === 'promoted' && 'Selamat! Kamu Naik Liga!'}
                {activeEvaluation.outcome === 'retained' && 'Kamu Berhasil Bertahan!'}
                {activeEvaluation.outcome === 'relegated' && 'Degradasi Liga! Tetap Semangat!'}
              </h2>
              <p className="text-xs text-muted">
                {activeEvaluation.outcome === 'promoted' &&
                  `Dedikasi luar biasamu mengantarkanmu ke peringkat #${activeEvaluation.finalRank} dengan perolehan ${activeEvaluation.finalWeeklyExp} EXP!`}
                {activeEvaluation.outcome === 'retained' &&
                  `Kamu mengakhiri musim di peringkat #${activeEvaluation.finalRank} dan mempertahankan posisimu di ${LEAGUES_CONFIG[activeEvaluation.newLeague].name}.`}
                {activeEvaluation.outcome === 'relegated' &&
                  `Kamu finis di peringkat #${activeEvaluation.finalRank}. Saatnya bangkit kembali di musim baru untuk merebut tiket promosi!`}
              </p>
            </div>

            {/* TRANSISI KASTA */}
            <div className="flex items-center justify-center gap-4 py-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-center">
                <span className="text-2xl">{LEAGUES_CONFIG[activeEvaluation.oldLeague].badgeIcon}</span>
                <span className="block text-[10px] font-mono text-muted mt-1">
                  {LEAGUES_CONFIG[activeEvaluation.oldLeague].name}
                </span>
              </div>
              <span className="text-xl text-cyan font-bold">➔</span>
              <div className="text-center">
                <span className="text-2xl">{LEAGUES_CONFIG[activeEvaluation.newLeague].badgeIcon}</span>
                <span className="block text-[10px] font-mono text-cyan font-bold mt-1">
                  {LEAGUES_CONFIG[activeEvaluation.newLeague].name}
                </span>
              </div>
            </div>

            <button
              onClick={handleCloseEvaluationModal}
              className="w-full clip-corner bg-gradient-to-r from-cyan to-magenta py-3 font-body text-xs font-bold text-void hover:opacity-90 transition-opacity"
            >
              Mulai Musim #{activeEvaluation.seasonNumber + 1} Sekarang ▸
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
