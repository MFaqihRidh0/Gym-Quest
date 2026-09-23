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
  LeagueRoomData,
} from './types';
import { getUserProfile } from '../program-engine/storage';
import { getSupabaseClient } from '@/lib/supabase/client';

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

    // Bersihkan semua kompetitor fiktif / fake bot dari state lokal
    const hasFakeCompetitors = state.competitors.some((c) => !c.isUser || c.id.startsWith('rival-'));
    if (hasFakeCompetitors) {
      state.competitors = state.competitors.filter((c) => c.isUser && !c.id.startsWith('rival-'));
      if (state.competitors.length === 0) {
        state.competitors = generateCompetitorsForLeague(state.leagueId, getUserTotalExp());
      }
      saveSeasonState(state);
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



  // Urutkan kembali berdasarkan weeklyExp terbesar
  state.competitors.sort((a, b) => b.weeklyExp - a.weeklyExp);
  saveSeasonState(state);

  const newRank = state.competitors.findIndex((c) => c.isUser) + 1;

  // Kirim pembaruan EXP mingguan ke room liga di Supabase jika sedang login
  try {
    const client = getSupabaseClient();
    if (client) {
      (async () => {
        try {
          const { error } = await client.rpc('add_room_member_exp', { p_exp: expAmount });
          if (error) {
            // Fallback manual update jika RPC belum dibuat di Supabase
            const { data } = await client.auth.getUser();
            if (data?.user?.id) {
              const { data: member } = await client
                .from('league_room_members')
                .select('id, weekly_exp')
                .eq('user_id', data.user.id)
                .order('joined_at', { ascending: false })
                .limit(1)
                .single();

              if (member) {
                await client
                  .from('league_room_members')
                  .update({ weekly_exp: (member.weekly_exp || 0) + expAmount })
                  .eq('id', member.id);
              }
            }
          }
        } catch {
          // Non-blocking
        }
      })();
    }
  } catch {
    // Non-blocking
  }

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

/**
 * Mengambil daftar pemain nyata dari Supabase profiles dan menggabungkan dengan profil user saat ini.
 * Menghilangkan seluruh bot / profil fiktif dari leaderboard.
 */
export async function fetchRealLeaderboardCompetitors(
  currentLeague: LeagueTier = 'iron',
): Promise<LeaderboardCompetitor[]> {
  const client = getSupabaseClient();
  const localProfile = getUserProfile();
  const localTotalExp = getUserTotalExp();

  const fallbackUser: LeaderboardCompetitor = {
    id: 'user-current',
    username: `${localProfile.username || 'Kamu'}`,
    title: localProfile.goal ? `Target: ${localProfile.goal}` : LEAGUES_CONFIG[currentLeague]?.title || 'Gladiator',
    avatar: localProfile.avatar || '⚔️',
    level: Math.max(1, Math.floor(localTotalExp / 300) + 1),
    weeklyExp: localTotalExp,
    totalExp: localTotalExp,
    isUser: true,
    streakDays: localProfile.streakDays || 1,
  };

  if (!client) {
    return [fallbackUser];
  }

  try {
    let activeUserId: string | null = null;
    try {
      const { data: authData } = await client.auth.getUser();
      if (authData?.user) {
        activeUserId = authData.user.id;
      }
    } catch {
      // Offline / guest
    }

    const { data: profiles, error } = await client
      .from('profiles')
      .select('id, username, avatar, fitness_level, streak_days, total_exp, current_league')
      .order('total_exp', { ascending: false });

    if (error || !profiles || profiles.length === 0) {
      return [fallbackUser];
    }

    // Ubah data profil Supabase menjadi format LeaderboardCompetitor nyata
    const realCompetitors: LeaderboardCompetitor[] = profiles.map((p) => {
      const isThisUser = Boolean(
        (activeUserId && p.id === activeUserId) ||
        (!activeUserId && p.username === localProfile.username)
      );

      const exp = isThisUser ? Math.max(p.total_exp || 0, localTotalExp) : (p.total_exp || 0);
      const level = Math.max(1, Math.floor(exp / 300) + 1);
      const title = p.fitness_level
        ? p.fitness_level.charAt(0).toUpperCase() + p.fitness_level.slice(1)
        : 'Gladiator';

      return {
        id: p.id,
        username: isThisUser ? `${p.username || localProfile.username || 'Kamu'} (Kamu)` : (p.username || 'Gladiator'),
        title,
        avatar: p.avatar || '⚔️',
        level,
        weeklyExp: exp,
        totalExp: exp,
        isUser: isThisUser,
        streakDays: p.streak_days || 0,
      };
    });

    // Jika user lokal belum terdaftar di Supabase, masukkan user lokal ke daftar
    const hasUser = realCompetitors.some((c) => c.isUser);
    if (!hasUser) {
      realCompetitors.push({
        ...fallbackUser,
        username: `${localProfile.username || 'Kamu'} (Kamu)`,
      });
    }

    // Urutkan berdasarkan total exp terbesar
    realCompetitors.sort((a, b) => b.weeklyExp - a.weeklyExp);

    return realCompetitors;
  } catch (err) {
    console.error('Failed to fetch real leaderboard competitors:', err);
    return [fallbackUser];
  }
}

export interface FetchRoomResult {
  competitors: LeaderboardCompetitor[];
  roomData: LeagueRoomData | null;
}

/**
 * Mengambil daftar kompetitor khusus di dalam Room / Cohort (maksimal 11 orang).
 * Jika user belum punya room aktif, RPC get_or_join_league_room akan memasangkan user ke room terbuka (<11 orang)
 * atau membuat room baru jika room sebelumnya sudah penuh / lewat 24 jam.
 */
export async function fetchRoomLeaderboardCompetitors(
  currentLeague: LeagueTier = 'iron',
): Promise<FetchRoomResult> {
  const client = getSupabaseClient();
  const localProfile = getUserProfile();
  const localTotalExp = getUserTotalExp();

  const fallbackUser: LeaderboardCompetitor = {
    id: 'user-current',
    username: `${localProfile.username || 'Kamu'} (Kamu)`,
    title: localProfile.goal ? `Target: ${localProfile.goal}` : LEAGUES_CONFIG[currentLeague]?.title || 'Gladiator',
    avatar: localProfile.avatar || '⚔️',
    level: Math.max(1, Math.floor(localTotalExp / 300) + 1),
    weeklyExp: localTotalExp,
    totalExp: localTotalExp,
    isUser: true,
    streakDays: localProfile.streakDays || 1,
  };

  if (!client) {
    return { competitors: [fallbackUser], roomData: null };
  }

  try {
    const { data: authData } = await client.auth.getUser();
    const activeUserId = authData?.user?.id || null;

    if (!activeUserId) {
      const globalReal = await fetchRealLeaderboardCompetitors(currentLeague);
      return { competitors: globalReal, roomData: null };
    }

    // 1. Panggil RPC get_or_join_league_room
    const { data: rpcRes, error: rpcErr } = await client.rpc('get_or_join_league_room', {
      p_league_tier: currentLeague,
    });

    if (rpcErr || !rpcRes || rpcRes.error) {
      console.warn('RPC get_or_join_league_room not ready or error, fallback to profiles:', rpcErr || rpcRes?.error);
      const globalReal = await fetchRealLeaderboardCompetitors(currentLeague);
      return { competitors: globalReal, roomData: null };
    }

    const roomData: LeagueRoomData = {
      roomId: rpcRes.room_id,
      roomCode: rpcRes.room_code,
      leagueTier: (rpcRes.league_tier as LeagueTier) || currentLeague,
      seasonStartAt: rpcRes.season_start_at,
      seasonEndAt: rpcRes.season_end_at,
      memberCount: rpcRes.member_count || 1,
      maxMembers: 11,
      weeklyExp: rpcRes.weekly_exp || 0,
    };

    // 2. Ambil seluruh anggota room ini beserta profil mereka (maksimal 11 orang)
    const { data: members, error: membersErr } = await client
      .from('league_room_members')
      .select(`
        id,
        user_id,
        weekly_exp,
        joined_at,
        profiles (
          id,
          username,
          avatar,
          fitness_level,
          streak_days,
          total_exp
        )
      `)
      .eq('room_id', roomData.roomId)
      .order('weekly_exp', { ascending: false });

    if (membersErr || !members || members.length === 0) {
      return { competitors: [fallbackUser], roomData };
    }

    // Ubah format ke LeaderboardCompetitor
    const competitors: LeaderboardCompetitor[] = members.map((m: any) => {
      const prof = (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles) || {};
      const isThisUser = m.user_id === activeUserId;
      const weeklyExp = Number(m.weekly_exp) || 0;
      const totalExp = prof.total_exp ? Number(prof.total_exp) : weeklyExp;
      const level = Math.max(1, Math.floor(totalExp / 300) + 1);
      const title = prof.fitness_level
        ? prof.fitness_level.charAt(0).toUpperCase() + prof.fitness_level.slice(1)
        : 'Gladiator';

      return {
        id: m.user_id,
        username: isThisUser
          ? `${prof.username || localProfile.username || 'Kamu'} (Kamu)`
          : (prof.username || 'Gladiator'),
        title,
        avatar: prof.avatar || '⚔️',
        level,
        weeklyExp,
        totalExp,
        isUser: isThisUser,
        streakDays: prof.streak_days || 0,
      };
    });

    // Pastikan user sendiri ada dalam list
    const hasUser = competitors.some((c) => c.isUser);
    if (!hasUser) {
      competitors.push({
        ...fallbackUser,
        weeklyExp: roomData.weeklyExp || 0,
      });
    }

    // Urutkan kembali berdasarkan weeklyExp terbesar
    competitors.sort((a, b) => b.weeklyExp - a.weeklyExp);

    return { competitors, roomData };
  } catch (err) {
    console.error('Failed to fetch room leaderboard competitors:', err);
    const globalReal = await fetchRealLeaderboardCompetitors(currentLeague);
    return { competitors: globalReal, roomData: null };
  }
}

