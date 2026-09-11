import type { UserProfile, WorkoutProgram, WorkoutSessionLog } from './types';
import { addUserExp, calculateWorkoutExp } from '../gamification/leaderboardStorage';
import { pushSingleWorkoutLogToCloud } from '../auth/syncManager';

const STORAGE_KEYS = {
  PROFILE: 'gymquest_user_profile',
  HISTORY: 'gymquest_workout_history',
  CUSTOM_PROGRAMS: 'gymquest_custom_programs',
} as const;

export const DEFAULT_USER_PROFILE: UserProfile = {
  level: 'pemula',
  goal: 'otot',
  targetDurationMinutes: 15,
  streakDays: 0,
  lastWorkoutDate: null,
  completedSessionsCount: 0,
  hasCompletedOnboarding: false,
};

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getUserProfile(): UserProfile {
  if (!isClient()) return DEFAULT_USER_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_USER_PROFILE;
    return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile to localStorage:', e);
  }
}

export function getWorkoutHistory(): WorkoutSessionLog[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordWorkoutSession(log: Omit<WorkoutSessionLog, 'id'>): {
  log: WorkoutSessionLog;
  newStreak: number;
  earnedExp: number;
  newWeeklyExp: number;
  newRank: number;
} {
  const sessionLog: WorkoutSessionLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };

  const currentHistory = getWorkoutHistory();
  const updatedHistory = [sessionLog, ...currentHistory];

  if (isClient()) {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error('Failed to save workout session log:', e);
    }
  }

  // Update User Profile & calculate streak
  const profile = getUserProfile();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  let newStreak = profile.streakDays;
  if (!profile.lastWorkoutDate) {
    newStreak = 1;
  } else if (profile.lastWorkoutDate === today) {
    // Sudah latihan hari ini, streak tetap
    newStreak = profile.streakDays > 0 ? profile.streakDays : 1;
  } else if (profile.lastWorkoutDate === yesterday) {
    // Melanjutkan streak dari kemarin!
    newStreak = profile.streakDays + 1;
  } else {
    // Terputus lebih dari 1 hari, mulai streak baru
    newStreak = 1;
  }

  const updatedProfile: UserProfile = {
    ...profile,
    streakDays: newStreak,
    lastWorkoutDate: today,
    completedSessionsCount: profile.completedSessionsCount + 1,
  };

  saveUserProfile(updatedProfile);

  // Gamifikasi: Hitung & berikan EXP ke akun pengguna serta sinkronkan posisi leaderboard
  const earnedExp = calculateWorkoutExp(
    sessionLog.durationSeconds,
    sessionLog.totalRepsCompleted,
    newStreak,
  );
  const expResult = addUserExp(earnedExp, `Workout: ${sessionLog.programTitle}`);

  // Cloud Sync: Simpan ke Supabase di latar belakang jika user sedang login
  pushSingleWorkoutLogToCloud(sessionLog).catch((e) => {
    console.warn('Could not sync workout session to cloud:', e);
  });

  return {
    log: sessionLog,
    newStreak,
    earnedExp,
    newWeeklyExp: expResult.newWeeklyExp,
    newRank: expResult.newRank,
  };
}

export function getCustomPrograms(): WorkoutProgram[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_PROGRAMS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomProgram(program: WorkoutProgram): WorkoutProgram[] {
  const current = getCustomPrograms();
  const existingIdx = current.findIndex((p) => p.id === program.id);
  let updated: WorkoutProgram[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = program;
  } else {
    updated = [program, ...current];
  }

  if (isClient()) {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_PROGRAMS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save custom program:', e);
    }
  }
  return updated;
}

export function deleteCustomProgram(programId: string): WorkoutProgram[] {
  const current = getCustomPrograms();
  const filtered = current.filter((p) => p.id !== programId);
  if (isClient()) {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_PROGRAMS, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to delete custom program:', e);
    }
  }
  return filtered;
}

export function calculateSummaryStats(history: WorkoutSessionLog[]) {
  const totalSessions = history.length;
  const totalMinutes = Math.round(
    history.reduce((sum, item) => sum + (item.durationSeconds || 0), 0) / 60,
  );
  const totalCalories = Math.round(
    history.reduce((sum, item) => sum + (item.caloriesBurned || 0), 0),
  );
  const totalReps = history.reduce((sum, item) => sum + (item.totalRepsCompleted || 0), 0);

  return { totalSessions, totalMinutes, totalCalories, totalReps };
}
