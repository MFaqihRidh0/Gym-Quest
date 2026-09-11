import {
  generateCompetitorsForLeague,
  getNextLeague,
  getPreviousLeague,
  LEAGUES_CONFIG,
} from './leagues';
import type {
  LeaderboardCompetitor,
  LeagueTier,
  SeasonEvaluationResult,
  WeeklySeasonState,
} from './types';
import { getUserProfile } from '../program-engine/storage';

const STORAGE_KEYS = {
  SEASON: 'gymquest_leaderboard_season_v1',
  TOTAL_EXP: 'gymquest_user_total_exp_v1',
} as const;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getUserTotalExp(): number {
  if (!isClient()) return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TOTAL_EXP);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function saveUserTotalExp(exp: number): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.TOTAL_EXP, String(exp));
  } catch (e) {
    console.error('Failed to save total EXP:', e);
  }
}

/**
 * Inisialisasi musim 7 hari baru
 */
export function createNewSeason(
  seasonNumber: number,
  leagueId: LeagueTier,
  lastEvaluation: SeasonEvaluationResult | null = null,
): WeeklySeasonState {
  const now = Date.now();
  const profile = getUserProfile();
  const competitors = generateCompetitorsForLeague(leagueId, 0, profile.streakDays || 1);

  const state: WeeklySeasonState = {
    seasonNumber,
    leagueId,
    seasonStartDate: now,
    seasonEndDate: now + SEVEN_DAYS_MS,
    competitors,
    lastEvaluation,
  };

  saveSeasonState(state);
  return state;
}

export function saveSeasonState(state: WeeklySeasonState): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.SEASON, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save season state:', e);
  }
}

/**
 * Mengambil state musim mingguan saat ini dan mengecek apakah siklus 7 hari sudah berakhir.
 */
export function getWeeklySeasonState(): WeeklySeasonState {
  if (!isClient()) {
    return {
      seasonNumber: 1,
      leagueId: 'iron',
      seasonStartDate: Date.now(),
      seasonEndDate: Date.now() + SEVEN_DAYS_MS,
      competitors: generateCompetitorsForLeague('iron', 0),
      lastEvaluation: null,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEASON);
    if (!raw) {
      return createNewSeason(1, 'iron');
    }

    const state: WeeklySeasonState = JSON.parse(raw);
    const now = Date.now();

    // Cek apakah 7 hari sudah lewat (Season Evaluation needed)
    if (now >= state.seasonEndDate) {
      return evaluateAndStartNextSeason(state);
    }

    return state;
  } catch (e) {
    console.error('Failed to parse weekly season state:', e);
    return createNewSeason(1, 'iron');
  }
}

/**
 * Evaluasi akhir musim 7 hari:
 * - 3 Teratas: Promosi (Naik Liga)
 * - 5 Tengah: Bertahan (Tetap di Liga)
 * - 3 Terbawah: Degradasi (Turun Liga)
 */
export function evaluateAndStartNextSeason(currentState: WeeklySeasonState): WeeklySeasonState {
  // Urutkan kompetitor
  const sorted = [...currentState.competitors].sort((a, b) => b.weeklyExp - a.weeklyExp);
  const userIndex = sorted.findIndex((c) => c.isUser);
  const userRank = userIndex >= 0 ? userIndex + 1 : 11;
  const userCompetitor = sorted[userIndex] || { weeklyExp: 0 };

  const oldLeague = currentState.leagueId;
  let newLeague = oldLeague;
  let outcome: 'promoted' | 'retained' | 'relegated' = 'retained';

  if (userRank <= 3) {
    newLeague = getNextLeague(oldLeague);
    outcome = 'promoted';
  } else if (userRank <= 8) {
    newLeague = oldLeague;
    outcome = 'retained';
  } else {
    newLeague = getPreviousLeague(oldLeague);
    outcome = 'relegated';
  }

  const evalResult: SeasonEvaluationResult = {
    seasonNumber: currentState.seasonNumber,
    oldLeague,
    newLeague,
    finalRank: userRank,
    finalWeeklyExp: userCompetitor.weeklyExp,
    outcome,
    evaluatedAt: Date.now(),
  };

  // Mulai musim baru dengan kasta liga hasil evaluasi
  return createNewSeason(currentState.seasonNumber + 1, newLeague, evalResult);
}

/**
 * Menambahkan EXP ke pengguna dan merefleksikan posisi di leaderboard
 */
export function addUserExp(
  expAmount: number,
  _reason: string = 'workout_completed',
): {
  newWeeklyExp: number;
  newTotalExp: number;
  newRank: number;
  state: WeeklySeasonState;
} {
  const state = getWeeklySeasonState();
  const currentTotal = getUserTotalExp();
  const updatedTotal = currentTotal + expAmount;
  saveUserTotalExp(updatedTotal);

  // Cari user dalam daftar kompetitor
  let user = state.competitors.find((c) => c.isUser);
  const profile = getUserProfile();

  if (!user) {
    user = {
      id: 'user-current',
      username: 'Kamu (Knight-01)',
      title: LEAGUES_CONFIG[state.leagueId].title,
      avatar: '⚔️',
      level: Math.max(1, Math.round(LEAGUES_CONFIG[state.leagueId].order * 2)),
      weeklyExp: 0,
      totalExp: updatedTotal,
      isUser: true,
      streakDays: profile.streakDays || 1,
    };
    state.competitors.push(user);
  }

  user.weeklyExp += expAmount;
  user.totalExp = updatedTotal;
  user.streakDays = profile.streakDays || 1;

  // Sedikit berikan fluktuasi acak pada 1-2 rival agar leaderboard terasa hidup
  state.competitors.forEach((c) => {
    if (!c.isUser && Math.random() < 0.3) {
      c.weeklyExp += Math.floor(Math.random() * 20) + 10;
    }
  });

  // Urutkan kembali berdasarkan weeklyExp terbesar
  state.competitors.sort((a, b) => b.weeklyExp - a.weeklyExp);
  saveSeasonState(state);

  const newRank = state.competitors.findIndex((c) => c.isUser) + 1;

  return {
    newWeeklyExp: user.weeklyExp,
    newTotalExp: updatedTotal,
    newRank,
    state,
  };
}

/**
 * Hapus modal notifikasi evaluasi terakhir setelah dilihat user
 */
export function dismissEvaluationResult(): void {
  const state = getWeeklySeasonState();
  if (state.lastEvaluation) {
    state.lastEvaluation = null;
    saveSeasonState(state);
  }
}

/**
 * Menghitung estimasi perolehan EXP dari sebuah sesi latihan
 */
export function calculateWorkoutExp(
  durationSeconds: number,
  totalReps: number,
  streakDays: number,
): number {
  const baseExp = 100;
  const repsExp = totalReps * 5;
  const durationMinutes = Math.floor(durationSeconds / 60);
  const timeExp = durationMinutes * 10;
  const streakBonus = Math.min(streakDays, 7) * 15;

  return baseExp + repsExp + timeExp + streakBonus;
}
