import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { UserProfile, WorkoutProgram, WorkoutSessionLog } from '../program-engine/types';
import {
  getCustomPrograms,
  getUserProfile,
  getWorkoutHistory,
  saveCustomProgram,
  saveUserProfile,
} from '../program-engine/storage';
import { getUserTotalExp } from '../gamification/leaderboardStorage';
import type { User } from '@supabase/supabase-js';

export type SyncStatus = 'synced' | 'syncing' | 'offline_local' | 'error';

/**
 * Mendapatkan user yang sedang aktif login di Supabase
 */
export async function getActiveUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Mendaftar akun baru dengan email dan password
 */
export async function signUpUser(
  email: string,
  password: string,
  username: string = 'Knight-01',
): Promise<{ user: User | null; error: string | null }> {
  if (password.length < 8) {
    return { user: null, error: 'Kata sandi minimal harus terdiri dari 8 karakter.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { user: null, error: 'Kata sandi harus mengandung minimal 1 huruf besar (A-Z).' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return { user: null, error: 'Kata sandi harus mengandung minimal 1 karakter simbol khusus (contoh: !@#$%^&*).' };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      user: null,
      error: 'Kredensial Supabase belum dikonfigurasi di .env.local. Masih dalam mode offline lokal.',
    };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      // Sinkronkan data lokal ke cloud setelah pendaftaran
      await syncLocalToCloud(data.user.id);
    }

    return { user: data.user, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mendaftar akun';
    return { user: null, error: message };
  }
}

/**
 * Masuk ke akun yang sudah ada dengan email dan password
 */
export async function signInUser(
  email: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      user: null,
      error: 'Kredensial Supabase belum dikonfigurasi di .env.local.',
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      // Sinkronkan data dari cloud ke lokal dan sebaliknya
      await syncCloudToLocal(data.user.id);
    }

    return { user: data.user, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal masuk akun';
    return { user: null, error: message };
  }
}

/**
 * Keluar dari akun Supabase
 */
export async function signOutUser(): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: null };

  try {
    const { error } = await client.auth.signOut();
    return { error: error ? error.message : null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal keluar akun';
    return { error: message };
  }
}

/**
 * Sinkronisasi data lokal ke cloud Supabase
 */
export async function syncLocalToCloud(userId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const localProfile = getUserProfile();
    const localHistory = getWorkoutHistory();
    const localCustomPrograms = getCustomPrograms();
    const totalExp = getUserTotalExp();

    // 1. Simpan/Update profile di Supabase
    await client.from('profiles').upsert({
      id: userId,
      username: localProfile.username || 'Knight-01',
      avatar: localProfile.avatar || '⚔️',
      fitness_level: localProfile.level,
      fitness_goal: localProfile.goal,
      target_duration: localProfile.targetDurationMinutes,
      streak_days: localProfile.streakDays,
      last_workout_date: localProfile.lastWorkoutDate,
      completed_sessions_count: localProfile.completedSessionsCount,
      total_exp: totalExp,
      updated_at: new Date().toISOString(),
    });

    // 2. Simpan workout logs lokal yang belum ada di cloud
    if (localHistory.length > 0) {
      const logsPayload = localHistory.map((log) => ({
        id: log.id,
        user_id: userId,
        program_id: log.programId,
        program_title: log.programTitle,
        timestamp: log.timestamp,
        duration_seconds: log.durationSeconds,
        completed_exercises_count: log.completedExercisesCount,
        total_exercises_count: log.totalExercisesCount,
        total_reps_completed: log.totalRepsCompleted,
        calories_burned: log.caloriesBurned,
      }));

      await client.from('workout_logs').upsert(logsPayload, { onConflict: 'id' });
    }

    // 3. Simpan custom programs lokal ke cloud
    if (localCustomPrograms.length > 0) {
      const programsPayload = localCustomPrograms.map((prog) => ({
        id: prog.id,
        user_id: userId,
        title: prog.title,
        category: prog.category,
        level: prog.level,
        goal: prog.goal,
        description: prog.description,
        estimated_minutes: prog.estimatedMinutes,
        badge: prog.badge,
        exercises: prog.exercises,
        updated_at: new Date().toISOString(),
      }));

      await client.from('custom_programs').upsert(programsPayload, { onConflict: 'id' });
    }

    return true;
  } catch (err) {
    console.error('Failed to sync local data to Supabase cloud:', err);
    return false;
  }
}

/**
 * Sinkronisasi data cloud Supabase ke penyimpanan lokal
 */
export async function syncCloudToLocal(userId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // 1. Ambil profil dari cloud
    const { data: cloudProfile } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (cloudProfile) {
      const updatedProfile: UserProfile = {
        level: cloudProfile.fitness_level || 'pemula',
        goal: cloudProfile.fitness_goal || 'otot',
        targetDurationMinutes: cloudProfile.target_duration || 15,
        streakDays: Math.max(cloudProfile.streak_days || 0, getUserProfile().streakDays),
        lastWorkoutDate: cloudProfile.last_workout_date || null,
        completedSessionsCount: cloudProfile.completed_sessions_count || 0,
        hasCompletedOnboarding: true,
        username: cloudProfile.username || 'Knight-01',
        avatar: cloudProfile.avatar || '⚔️',
      };
      saveUserProfile(updatedProfile);
    }

    // 2. Ambil riwayat latihan dari cloud
    const { data: cloudLogs } = await client
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (cloudLogs && Array.isArray(cloudLogs)) {
      const localLogs = getWorkoutHistory();
      const localLogIds = new Set(localLogs.map((l) => l.id));

      const mergedLogs: WorkoutSessionLog[] = [...localLogs];
      cloudLogs.forEach((cl) => {
        if (!localLogIds.has(cl.id)) {
          mergedLogs.push({
            id: cl.id,
            programId: cl.program_id,
            programTitle: cl.program_title,
            timestamp: Number(cl.timestamp),
            durationSeconds: cl.duration_seconds,
            completedExercisesCount: cl.completed_exercises_count,
            totalExercisesCount: cl.total_exercises_count,
            totalRepsCompleted: cl.total_reps_completed,
            caloriesBurned: cl.calories_burned,
          });
        }
      });

      mergedLogs.sort((a, b) => b.timestamp - a.timestamp);
      if (typeof window !== 'undefined') {
        localStorage.setItem('gymquest_workout_history', JSON.stringify(mergedLogs));
      }
    }

    // 3. Ambil program kustom dari cloud
    const { data: cloudPrograms } = await client
      .from('custom_programs')
      .select('*')
      .eq('user_id', userId);

    if (cloudPrograms && Array.isArray(cloudPrograms)) {
      cloudPrograms.forEach((cp) => {
        saveCustomProgram({
          id: cp.id,
          title: cp.title,
          category: cp.category,
          level: cp.level,
          goal: cp.goal,
          description: cp.description,
          estimatedMinutes: cp.estimated_minutes,
          badge: cp.badge,
          exercises: cp.exercises,
          isCustom: true,
        });
      });
    }

    return true;
  } catch (err) {
    console.error('Failed to sync Supabase cloud to local storage:', err);
    return false;
  }
}

/**
 * Menyimpan 1 log sesi latihan ke cloud Supabase (dipanggil di background saat workout selesai)
 */
export async function pushSingleWorkoutLogToCloud(log: WorkoutSessionLog): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const user = await getActiveUser();
    if (!user) return;

    await client.from('workout_logs').upsert({
      id: log.id,
      user_id: user.id,
      program_id: log.programId,
      program_title: log.programTitle,
      timestamp: log.timestamp,
      duration_seconds: log.durationSeconds,
      completed_exercises_count: log.completedExercisesCount,
      total_exercises_count: log.totalExercisesCount,
      total_reps_completed: log.totalRepsCompleted,
      calories_burned: log.caloriesBurned,
    });

    // Update streak dan count di profil cloud
    const localProfile = getUserProfile();
    await client
      .from('profiles')
      .update({
        streak_days: localProfile.streakDays,
        last_workout_date: localProfile.lastWorkoutDate,
        completed_sessions_count: localProfile.completedSessionsCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
  } catch (err) {
    console.warn('Background sync workout log failed, will retry on next sync:', err);
  }
}
