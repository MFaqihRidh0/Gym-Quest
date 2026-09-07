import type { FitnessGoal, FitnessLevel, ProgramCategory, WorkoutProgram } from './types';

export const DEFAULT_PROGRAMS: WorkoutProgram[] = [
  {
    id: 'full-body-starter',
    title: 'Full Body Ignition',
    category: 'full_body',
    level: 'pemula',
    goal: 'otot',
    badge: 'Kekuatan Menyeluruh',
    estimatedMinutes: 12,
    description:
      'Program latihan pembuka untuk mengaktifkan seluruh kelompok otot utama tubuh tanpa alat, membangun fondasi postur yang kokoh.',
    exercises: [
      { exerciseId: 'jumping_jacks', sets: 2, durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'squat', sets: 3, reps: 10, restSeconds: 25 },
      { exerciseId: 'push_up', sets: 3, reps: 8, restSeconds: 30 },
      { exerciseId: 'lunges', sets: 2, reps: 10, restSeconds: 25 },
      { exerciseId: 'plank', sets: 2, durationSeconds: 25, restSeconds: 30 },
      { exerciseId: 'child_pose', sets: 1, durationSeconds: 40, restSeconds: 0 },
    ],
  },
  {
    id: 'cardio-blaster',
    title: 'High-Burn Cardio Shred',
    category: 'cardio',
    level: 'menengah',
    goal: 'kurus',
    badge: 'Bakar Lemak Cepat',
    estimatedMinutes: 15,
    description:
      'Latihan interval intensitas tinggi (HIIT) tanpa henti untuk memaksimalkan pembakaran kalori dan meningkatkan stamina paru-paru.',
    exercises: [
      { exerciseId: 'jumping_jacks', sets: 3, durationSeconds: 40, restSeconds: 20 },
      { exerciseId: 'high_knees', sets: 3, durationSeconds: 30, restSeconds: 25 },
      { exerciseId: 'squat', sets: 3, reps: 15, restSeconds: 20 },
      { exerciseId: 'mountain_climbers', sets: 3, durationSeconds: 30, restSeconds: 25 },
      { exerciseId: 'arm_raise', sets: 2, reps: 15, restSeconds: 20 },
      { exerciseId: 'cobra_stretch', sets: 1, durationSeconds: 35, restSeconds: 0 },
    ],
  },
  {
    id: 'core-armor',
    title: 'Iron Core & Abs Defense',
    category: 'core',
    level: 'menengah',
    goal: 'otot',
    badge: 'Perut Rata & Kuat',
    estimatedMinutes: 14,
    description:
      'Fokus mendalam pada penguatan dinding perut, pinggul, dan punggung bawah untuk stabilitas gerak atletik dan mencegah cedera.',
    exercises: [
      { exerciseId: 'sit_up', sets: 3, reps: 12, restSeconds: 25 },
      { exerciseId: 'mountain_climbers', sets: 3, durationSeconds: 30, restSeconds: 25 },
      { exerciseId: 'plank', sets: 3, durationSeconds: 35, restSeconds: 30 },
      { exerciseId: 'squat', sets: 2, reps: 12, restSeconds: 20 },
      { exerciseId: 'cobra_stretch', sets: 2, durationSeconds: 30, restSeconds: 15 },
    ],
  },
  {
    id: 'stretching-mobility',
    title: 'Daily Recovery & Mobility',
    category: 'stretching',
    level: 'pemula',
    goal: 'stamina',
    badge: 'Anti-Kaku & Relaksasi',
    estimatedMinutes: 10,
    description:
      'Rangkaian peregangan lembut untuk memulihkan otot yang tegang setelah seharian duduk atau berolahraga, memperbaiki fleksibilitas sendi.',
    exercises: [
      { exerciseId: 'arm_raise', sets: 2, reps: 12, restSeconds: 15 },
      { exerciseId: 'lunges', sets: 2, reps: 8, restSeconds: 20 },
      { exerciseId: 'cobra_stretch', sets: 3, durationSeconds: 35, restSeconds: 20 },
      { exerciseId: 'child_pose', sets: 3, durationSeconds: 45, restSeconds: 15 },
    ],
  },
  {
    id: 'full-body-pro',
    title: 'Spartan Full Body Mastery',
    category: 'full_body',
    level: 'mahir',
    goal: 'otot',
    badge: 'Daya Tahan Maksimal',
    estimatedMinutes: 20,
    description:
      'Kombinasi komprehensif tingkat lanjut yang memacu kekuatan murni dan ketahanan kardiovaskular dalam satu sesi terpadu.',
    exercises: [
      { exerciseId: 'jumping_jacks', sets: 3, durationSeconds: 45, restSeconds: 20 },
      { exerciseId: 'push_up', sets: 4, reps: 15, restSeconds: 30 },
      { exerciseId: 'squat', sets: 4, reps: 18, restSeconds: 25 },
      { exerciseId: 'mountain_climbers', sets: 3, durationSeconds: 40, restSeconds: 25 },
      { exerciseId: 'lunges', sets: 3, reps: 14, restSeconds: 25 },
      { exerciseId: 'plank', sets: 3, durationSeconds: 45, restSeconds: 30 },
      { exerciseId: 'child_pose', sets: 1, durationSeconds: 60, restSeconds: 0 },
    ],
  },
];

export function getRecommendedProgram(
  level: FitnessLevel,
  goal: FitnessGoal,
  _duration?: number,
): WorkoutProgram {
  if (goal === 'kurus') {
    return DEFAULT_PROGRAMS.find((p) => p.id === 'cardio-blaster') || DEFAULT_PROGRAMS[1];
  }
  if (goal === 'stamina') {
    return level === 'pemula'
      ? DEFAULT_PROGRAMS.find((p) => p.id === 'stretching-mobility') || DEFAULT_PROGRAMS[3]
      : DEFAULT_PROGRAMS.find((p) => p.id === 'cardio-blaster') || DEFAULT_PROGRAMS[1];
  }
  // Goal: otot
  if (level === 'mahir') {
    return DEFAULT_PROGRAMS.find((p) => p.id === 'full-body-pro') || DEFAULT_PROGRAMS[4];
  }
  if (level === 'menengah') {
    return DEFAULT_PROGRAMS.find((p) => p.id === 'core-armor') || DEFAULT_PROGRAMS[2];
  }
  return DEFAULT_PROGRAMS[0]; // full-body-starter
}

export function filterPrograms(
  programs: WorkoutProgram[],
  category: ProgramCategory | 'all',
): WorkoutProgram[] {
  if (category === 'all') return programs;
  return programs.filter((p) => p.category === category);
}
