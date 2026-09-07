import type { ExerciseCode } from '../rep-counter/exercises';

export type FitnessLevel = 'pemula' | 'menengah' | 'mahir';
export type FitnessGoal = 'kurus' | 'otot' | 'stamina';
export type SessionDuration = 10 | 15 | 20;

export type ProgramCategory = 'full_body' | 'cardio' | 'core' | 'stretching' | 'custom';

export interface ExerciseItem {
  id: string;
  name: string;
  category: 'dada' | 'kaki' | 'perut' | 'core' | 'bahu' | 'kardio' | 'fleksibilitas';
  description: string;
  instructions: string[];
  targetMuscles: string[];
  defaultSets: number;
  defaultReps?: number;
  defaultDurationSeconds?: number;
  caloriesPerMinute: number;
  /** Terkoneksi dengan MediaPipe Rep Counter jika didukung */
  supportedAiCode?: ExerciseCode;
  /** Jenis visualisasi SVG gerakan */
  visualKey:
    | 'push_up'
    | 'squat'
    | 'sit_up'
    | 'plank'
    | 'arm_raise'
    | 'jumping_jacks'
    | 'high_knees'
    | 'mountain_climbers'
    | 'lunges'
    | 'cobra_stretch'
    | 'child_pose';
}

export interface ProgramExerciseRef {
  exerciseId: string;
  sets: number;
  reps?: number;
  durationSeconds?: number;
  restSeconds: number;
}

export interface WorkoutProgram {
  id: string;
  title: string;
  category: ProgramCategory;
  level: FitnessLevel;
  goal: FitnessGoal;
  description: string;
  estimatedMinutes: number;
  badge: string;
  exercises: ProgramExerciseRef[];
  isCustom?: boolean;
}

export interface WorkoutSessionLog {
  id: string;
  programId: string;
  programTitle: string;
  timestamp: number; // Date.now()
  durationSeconds: number;
  completedExercisesCount: number;
  totalExercisesCount: number;
  totalRepsCompleted: number;
  caloriesBurned: number;
}

export interface UserProfile {
  level: FitnessLevel;
  goal: FitnessGoal;
  targetDurationMinutes: SessionDuration;
  streakDays: number;
  lastWorkoutDate: string | null; // Format YYYY-MM-DD
  completedSessionsCount: number;
  hasCompletedOnboarding: boolean;
}
