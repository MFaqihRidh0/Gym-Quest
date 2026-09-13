import type { SupportedLanguage } from './types';
import type { ExerciseItem, FitnessLevel, FitnessGoal, WorkoutProgram } from '../program-engine/types';
import type { LeagueConfig, LeagueTier } from '../gamification/types';
import { LEAGUES_CONFIG } from '../gamification/leagues';
import { EXERCISE_CATALOG } from '../program-engine/exerciseCatalog';

export interface ProgramLocalizedText {
  title: string;
  badge: string;
  description: string;
}

export const PROGRAM_TRANSLATIONS: Record<string, Record<SupportedLanguage, ProgramLocalizedText>> = {
  'full-body-starter': {
    id: {
      title: 'Full Body Ignition',
      badge: 'Kekuatan Menyeluruh',
      description:
        'Program latihan pembuka untuk mengaktifkan seluruh kelompok otot utama tubuh tanpa alat, membangun fondasi postur yang kokoh.',
    },
    en: {
      title: 'Full Body Ignition',
      badge: 'Full Body Power',
      description:
        'An introductory workout routine activating all major muscle groups without equipment, building a solid postural foundation.',
    },
  },
  'cardio-blaster': {
    id: {
      title: 'High-Burn Cardio Shred',
      badge: 'Bakar Lemak Cepat',
      description:
        'Latihan interval intensitas tinggi (HIIT) tanpa henti untuk memaksimalkan pembakaran kalori dan meningkatkan stamina paru-paru.',
    },
    en: {
      title: 'High-Burn Cardio Shred',
      badge: 'Rapid Fat Burn',
      description:
        'High-intensity interval training (HIIT) designed to maximize calorie expenditure and boost cardiovascular endurance.',
    },
  },
  'core-armor': {
    id: {
      title: 'Iron Core & Abs Defense',
      badge: 'Perut Rata & Kuat',
      description:
        'Fokus mendalam pada penguatan dinding perut, pinggul, dan punggung bawah untuk stabilitas gerak atletik dan mencegah cedera.',
    },
    en: {
      title: 'Iron Core & Abs Defense',
      badge: 'Strong & Tight Core',
      description:
        'Deep targeting of abdominal wall, hips, and lower back muscles for athletic stability and injury prevention.',
    },
  },
  'stretching-mobility': {
    id: {
      title: 'Daily Recovery & Mobility',
      badge: 'Anti-Kaku & Relaksasi',
      description:
        'Rangkaian peregangan lembut untuk memulihkan otot yang tegang setelah seharian duduk atau berolahraga, memperbaiki fleksibilitas sendi.',
    },
    en: {
      title: 'Daily Recovery & Mobility',
      badge: 'Anti-Stiffness & Recovery',
      description:
        'Gentle stretching flow designed to relieve tight muscles after prolonged sitting or intense workouts, restoring joint mobility.',
    },
  },
  'full-body-pro': {
    id: {
      title: 'Spartan Full Body Mastery',
      badge: 'Daya Tahan Maksimal',
      description:
        'Kombinasi komprehensif tingkat lanjut yang memacu kekuatan murni dan ketahanan kardiovaskular dalam satu sesi terpadu.',
    },
    en: {
      title: 'Spartan Full Body Mastery',
      badge: 'Peak Endurance',
      description:
        'An advanced full-body regimen pushing pure physical strength and cardiovascular conditioning into a single unified session.',
    },
  },
};

export const EXERCISE_TRANSLATIONS: Record<
  string,
  Record<
    SupportedLanguage,
    {
      name: string;
      categoryLabel: string;
      description: string;
      instructions: string[];
      targetMuscles: string[];
    }
  >
> = {
  push_up: {
    id: {
      name: 'Push-up',
      categoryLabel: 'Dada',
      description: 'Latihan dasar kekuatan tubuh bagian atas untuk membentuk otot dada, trisep, dan bahu.',
      instructions: [
        'Posisikan tangan di lantai selebar bahu dan tubuh lurus dari kepala hingga tumit.',
        'Turunkan dada perlahan hingga siku membentuk sudut ~90 derajat.',
        'Dorong kembali ke posisi awal dengan mengencangkan otot dada dan perut.',
      ],
      targetMuscles: ['Dada', 'Trisep', 'Bahu Depan', 'Core'],
    },
    en: {
      name: 'Push-up',
      categoryLabel: 'Chest',
      description: 'Fundamental upper-body strength exercise developing chest, triceps, and anterior deltoids.',
      instructions: [
        'Place hands shoulder-width apart on the floor with a straight line from head to heels.',
        'Lower chest smoothly until elbows bend to approximately 90 degrees.',
        'Press back up to starting position engaging chest and core muscles.',
      ],
      targetMuscles: ['Chest', 'Triceps', 'Front Deltoids', 'Core'],
    },
  },
  squat: {
    id: {
      name: 'Bodyweight Squat',
      categoryLabel: 'Kaki',
      description: 'Latihan utama tubuh bagian bawah untuk menguatkan paha depan, paha belakang, dan gluteus.',
      instructions: [
        'Berdiri tegak dengan kaki selebar bahu dan ujung jari sedikit menghadap keluar.',
        'Dorong pinggul ke belakang seolah hendak duduk di kursi, tekuk lutut hingga paha sejajar lantai.',
        'Pastikan dada tetap tegak dan lutut sejajar dengan arah jari kaki.',
        'Dorong melalui tumit untuk kembali berdiri tegak.',
      ],
      targetMuscles: ['Paha Depan (Quadriceps)', 'Gluteus', 'Paha Belakang (Hamstrings)'],
    },
    en: {
      name: 'Bodyweight Squat',
      categoryLabel: 'Legs',
      description: 'Primary lower-body exercise strengthening quadriceps, hamstrings, and gluteal muscles.',
      instructions: [
        'Stand tall with feet shoulder-width apart and toes pointing slightly outward.',
        'Hinge hips backward as if sitting down, bending knees until thighs are parallel to the floor.',
        'Keep chest proud and knees tracking in line with toes.',
        'Drive firmly through heels to return to standing position.',
      ],
      targetMuscles: ['Quadriceps', 'Gluteus', 'Hamstrings'],
    },
  },
  sit_up: {
    id: {
      name: 'Sit-up / Crunches',
      categoryLabel: 'Perut',
      description: 'Latihan pengencangan otot perut bagian tengah dan atas untuk membangun daya tahan core.',
      instructions: [
        'Berbaring di matras dengan lutut ditekuk dan telapak kaki menapak rata di lantai.',
        'Letakkan tangan di dekat telinga atau menyilang di dada, jangan menarik leher.',
        'Angkat tubuh bagian atas menggunakan kontraksi otot perut.',
        'Turunkan kembali secara terkontrol.',
      ],
      targetMuscles: ['Perut (Rectus Abdominis)', 'Otot Perut Samping (Obliques)'],
    },
    en: {
      name: 'Sit-up / Crunches',
      categoryLabel: 'Abs',
      description: 'Targeted abdominal exercise strengthening rectus abdominis and core endurance.',
      instructions: [
        'Lie on a mat with knees bent and feet planted flat on the floor.',
        'Rest hands gently beside ears or crossed over chest without pulling on the neck.',
        'Lift upper torso smoothly through abdominal muscle contraction.',
        'Lower back down with controlled cadence.',
      ],
      targetMuscles: ['Rectus Abdominis', 'Obliques'],
    },
  },
  plank: {
    id: {
      name: 'Core Plank',
      categoryLabel: 'Core',
      description: 'Latihan isometrik terbaik untuk menguatkan seluruh sabuk otot perut dan menjaga kesehatan tulang belakang.',
      instructions: [
        'Posisikan lengan bawah di lantai sejajar dengan bahu.',
        'Luruskan kaki ke belakang dengan tumpuan pada ujung jari kaki.',
        'Kencangkan perut, bokong, dan paha agar tubuh membentuk garis lurus sempurna.',
        'Bernapas teratur dan tahan posisi tanpa membiarkan pinggul merosot.',
      ],
      targetMuscles: ['Core Dalam', 'Perut', 'Punggung Bawah', 'Bahu'],
    },
    en: {
      name: 'Core Plank',
      categoryLabel: 'Core',
      description: 'Premier isometric exercise developing deep abdominal girdle strength and spinal stability.',
      instructions: [
        'Rest forearms on the ground directly below your shoulders.',
        'Extend legs straight back, bearing weight on balls of feet.',
        'Brace core, glutes, and quadriceps forming an unbroken straight line.',
        'Breathe steadily while holding posture without letting hips sag.',
      ],
      targetMuscles: ['Deep Core', 'Abdominals', 'Lower Back', 'Shoulders'],
    },
  },
  arm_raise: {
    id: {
      name: 'Overhead Barbell / Arm Raise',
      categoryLabel: 'Bahu',
      description: 'Latihan mobilitas dan daya tahan otot bahu serta punggung atas dengan postur tegak.',
      instructions: [
        'Berdiri tegak dengan kaki selebar pinggul dan kedua lengan di samping.',
        'Angkat kedua tangan lurus ke atas kepala secara terkontrol.',
        'Rasakan kontraksi pada otot bahu saat lengan lurus di atas.',
        'Turunkan kembali ke posisi semula dengan tempo stabil.',
      ],
      targetMuscles: ['Bahu (Deltoids)', 'Trapezius', 'Punggung Atas'],
    },
    en: {
      name: 'Overhead Press / Arm Raise',
      categoryLabel: 'Shoulders',
      description: 'Mobility and muscular endurance drill for shoulders and upper back with upright posture.',
      instructions: [
        'Stand tall with feet hip-width apart and arms at your sides.',
        'Raise both arms overhead in a smooth, controlled vertical arc.',
        'Feel the contraction in deltoids and upper back at full overhead extension.',
        'Lower arms back to starting position at a steady cadence.',
      ],
      targetMuscles: ['Deltoids', 'Trapezius', 'Upper Back'],
    },
  },
  jumping_jacks: {
    id: {
      name: 'Jumping Jacks',
      categoryLabel: 'Kardio',
      description: 'Gerakan kardio dinamis untuk membakar kalori cepat, menaikkan detak jantung, dan melatih koordinasi.',
      instructions: [
        'Mulai dengan berdiri tegak, kaki rapat, dan kedua tangan di samping paha.',
        'Lompat membuka kaki selebar bahu sambil mengangkat kedua tangan bertepuk di atas kepala.',
        'Lompat kembali ke posisi awal dengan ritme teratur.',
        'Pertahankan pendaratan lembut pada bola kaki.',
      ],
      targetMuscles: ['Kardiovaskular', 'Betis', 'Bahu', 'Paha Luar'],
    },
    en: {
      name: 'Jumping Jacks',
      categoryLabel: 'Cardio',
      description: 'Dynamic cardio exercise accelerating caloric burn, elevating heart rate, and building coordination.',
      instructions: [
        'Begin standing upright with feet together and arms resting at your sides.',
        'Jump feet outward shoulder-width while raising arms overhead.',
        'Spring back to starting position with rhythmic tempo.',
        'Land softly on balls of feet to minimize joint impact.',
      ],
      targetMuscles: ['Cardiovascular', 'Calves', 'Shoulders', 'Outer Thighs'],
    },
  },
  high_knees: {
    id: {
      name: 'High Knees',
      categoryLabel: 'Kardio',
      description: 'Lari di tempat dengan mengangkat lutut setinggi pinggul untuk memacu metabolisme dan kekuatan paha.',
      instructions: [
        'Berdiri tegak dengan kaki selebar pinggul.',
        'Angkat satu lutut ke arah dada setinggi pinggul secara bergantian dengan cepat.',
        'Ayunkan lengan selaras dengan langkah kaki seperti sprint cepat.',
        'Jaga punggung tetap tegak dan hindari membungkuk ke belakang.',
      ],
      targetMuscles: ['Fleksor Pinggul', 'Quadriceps', 'Betis', 'Kardiovaskular'],
    },
    en: {
      name: 'High Knees',
      categoryLabel: 'Cardio',
      description: 'Sprint-in-place exercise driving knees to hip height to boost metabolic rate and hip flexor power.',
      instructions: [
        'Stand tall with feet hip-width apart.',
        'Drive knees alternately toward chest reaching waist level rapidly.',
        'Pump arms in coordination with footsteps as in an active sprint.',
        'Maintain upright torso avoiding leaning backward.',
      ],
      targetMuscles: ['Hip Flexors', 'Quadriceps', 'Calves', 'Cardiovascular'],
    },
  },
  mountain_climbers: {
    id: {
      name: 'Mountain Climbers',
      categoryLabel: 'Kardio & Core',
      description: 'Gerakan dinamis posisi plank yang memadukan kekuatan core dan kardio intensitas tinggi.',
      instructions: [
        'Mulai dalam posisi push-up / plank tinggi dengan tangan di bawah bahu.',
        'Tarik satu lutut ke arah dada tanpa menyentuhkan kaki ke lantai.',
        'Ganti kaki secara cepat seperti mendaki gunung dalam ritme stabil.',
        'Jaga pinggul tetap stabil dan tidak melonjak terlalu tinggi.',
      ],
      targetMuscles: ['Core', 'Bahu', 'Paha Depan', 'Kardiovaskular'],
    },
    en: {
      name: 'Mountain Climbers',
      categoryLabel: 'Cardio & Core',
      description: 'Dynamic high-tempo plank drill fusing deep core stability with high-intensity cardio endurance.',
      instructions: [
        'Start in a high plank position with hands planted under shoulders.',
        'Drive one knee forward toward chest without letting foot touch floor.',
        'Switch legs rapidly in a continuous running motion at steady rhythm.',
        'Keep hips level without bouncing excessively upward.',
      ],
      targetMuscles: ['Core', 'Shoulders', 'Quadriceps', 'Cardiovascular'],
    },
  },
  lunges: {
    id: {
      name: 'Forward Lunges',
      categoryLabel: 'Kaki',
      description: 'Latihan unilateral untuk melatih keseimbangan, paha depan, dan bokong secara mandiri.',
      instructions: [
        'Berdiri tegak dengan tangan di pinggang atau di depan dada.',
        'Langkahkan satu kaki ke depan, turunkan pinggul hingga kedua lutut membentuk sudut ~90 derajat.',
        'Lutut depan tidak melebihi ujung jari kaki, lutut belakang hampir menyentuh lantai.',
        'Dorong kembali ke posisi awal melalui tumit kaki depan.',
      ],
      targetMuscles: ['Quadriceps', 'Gluteus', 'Hamstrings', 'Keseimbangan'],
    },
    en: {
      name: 'Forward Lunges',
      categoryLabel: 'Legs',
      description: 'Unilateral lower-body movement training balance, quadriceps, and glutes independently.',
      instructions: [
        'Stand upright with hands on hips or clasped at chest height.',
        'Step one leg forward, lowering hips until both knees bend to 90 degrees.',
        'Keep front knee tracking over ankle, back knee hovering just off floor.',
        'Press firmly through front heel to return to starting position.',
      ],
      targetMuscles: ['Quadriceps', 'Gluteus', 'Hamstrings', 'Balance'],
    },
  },
  cobra_stretch: {
    id: {
      name: 'Cobra Stretch (Bhujangasana)',
      categoryLabel: 'Fleksibilitas',
      description: 'Peregangan lembut otot perut dan punggung untuk meredakan ketegangan akibat posisi duduk lama.',
      instructions: [
        'Tengkurap di lantai dengan telapak tangan di bawah bahu dan siku dekat tubuh.',
        'Dorong dada perlahan ke atas menggunakan kekuatan punggung dan lengan.',
        'Jauhkan bahu dari telinga dan pandangan rileks ke depan.',
        'Tahan posisi sambil menarik napas dalam secara teratur.',
      ],
      targetMuscles: ['Punggung Bawah', 'Dada', 'Perut', 'Fleksibilitas Tulang Belakang'],
    },
    en: {
      name: 'Cobra Stretch (Bhujangasana)',
      categoryLabel: 'Flexibility',
      description: 'Gentle spinal extension stretching abdominals and relieving lower back stiffness from desk work.',
      instructions: [
        'Lie prone on the mat with palms beneath shoulders and elbows close to ribs.',
        'Press chest upward smoothly utilizing back muscles and light arm support.',
        'Drop shoulders down away from ears with gaze relaxed forward.',
        'Hold position breathing deeply through diaphragm.',
      ],
      targetMuscles: ['Lower Back', 'Chest', 'Abdominals', 'Spinal Mobility'],
    },
  },
  child_pose: {
    id: {
      name: "Child's Pose (Balasana)",
      categoryLabel: 'Fleksibilitas',
      description: 'Pose istirahat restoratif untuk meregangkan punggung bawah, pinggul, dan menenangkan sistem saraf.',
      instructions: [
        'Berlutut di lantai dengan jempol kaki bersentuhan dan lutut dibuka selebar matras.',
        'Duduk ke tumit lalu rebahkan tubuh ke depan hingga dahi menyentuh lantai.',
        'Rentangkan kedua tangan lurus ke depan atau di samping tubuh.',
        'Tarik napas perlahan dan biarkan seluruh tubuh rileks sepenuhnya.',
      ],
      targetMuscles: ['Punggung Bawah', 'Pinggul', 'Bahu', 'Relaksasi Menyeluruh'],
    },
    en: {
      name: "Child's Pose (Balasana)",
      categoryLabel: 'Flexibility',
      description: 'Restorative resting posture decompressing spine, opening hips, and soothing nervous system.',
      instructions: [
        'Kneel on floor with big toes touching and knees opened wide.',
        'Sink hips back onto heels and fold torso forward resting forehead on mat.',
        'Extend arms forward or alongside body with relaxed shoulders.',
        'Inhale slowly and let all muscular tension dissolve.',
      ],
      targetMuscles: ['Lower Back', 'Hips', 'Shoulders', 'Full-Body Relaxation'],
    },
  },
};

export const LEAGUE_TIER_TRANSLATIONS: Record<
  LeagueTier,
  Record<
    SupportedLanguage,
    {
      name: string;
      title: string;
      description: string;
      lore: string;
    }
  >
> = {
  iron: {
    id: {
      name: 'Iron Initiate',
      title: 'Liga Besi Pemula',
      description: 'Kasta perintis bagi pengembara yang baru memulai disiplin latihan rumahan.',
      lore: 'Besi yang ditempa dalam kesunyian membentuk fondasi kekuatan sejati.',
    },
    en: {
      name: 'Iron Initiate',
      title: 'Iron Pioneer League',
      description: 'The starting rank for trainees embarking on their bodyweight discipline journey.',
      lore: 'Iron forged in silence creates the foundation of true strength.',
    },
  },
  bronze: {
    id: {
      name: 'Bronze Brawler',
      title: 'Liga Perunggu Petarung',
      description: 'Kasta petarung tangguh yang mulai menguasai ritme dan ketahanan fisik konsisten.',
      lore: 'Ketahanan dibangun melalui setiap repetisi yang membakar otot tanpa menyerah.',
    },
    en: {
      name: 'Bronze Brawler',
      title: 'Bronze Fighter League',
      description: 'Dedicated athletes mastering consistency, steady tempo, and muscular endurance.',
      lore: 'Endurance is forged through every burning repetition pushed without surrender.',
    },
  },
  silver: {
    id: {
      name: 'Silver Striker',
      title: 'Liga Perak Penyerang',
      description: 'Kasta atlet berteknik tinggi dengan mobilitas lincah dan komitmen kuat.',
      lore: 'Kecepatan dan presisi gerakan biomekanik menjadi senjata utama di arena.',
    },
    en: {
      name: 'Silver Striker',
      title: 'Silver Striker League',
      description: 'Technical athletes combining nimble mobility with high biomechanical precision.',
      lore: 'Speed and kinematic accuracy become your sharpest weapons in the arena.',
    },
  },
  gold: {
    id: {
      name: 'Gold Gladiator',
      title: 'Liga Emas Jawara',
      description: 'Kasta jawara veteran yang mendominasi program latihan intensitas tinggi.',
      lore: 'Kilau emas adalah saksi dedikasi tanpa kompromi menembus batas rasa lelah.',
    },
    en: {
      name: 'Gold Gladiator',
      title: 'Gold Champion League',
      description: 'Elite veteran gladiators dominating high-intensity bodyweight routines.',
      lore: 'The golden gleam bears testament to uncompromising devotion beyond all limits.',
    },
  },
  titan: {
    id: {
      name: 'Titan Colossus',
      title: 'Liga Titan Puncak',
      description: 'Piramida tertinggi kekuatan fisik. Tempat para legenda abadi GymQuest berkumpul.',
      lore: 'Hanya mereka yang memiliki disiplin mutlak yang mampu mempertahankan tahta Titan.',
    },
    en: {
      name: 'Titan Colossus',
      title: 'Titan Apex League',
      description: 'The pinnacle of physical capability. Where immortal GymQuest legends assemble.',
      lore: 'Only those with absolute discipline are able to claim and hold the Titan throne.',
    },
  },
};

export function getLocalizedProgram(program: WorkoutProgram, lang: SupportedLanguage): WorkoutProgram {
  const trans = PROGRAM_TRANSLATIONS[program.id]?.[lang];
  if (!trans) return program;
  return {
    ...program,
    title: trans.title,
    badge: trans.badge,
    description: trans.description,
  };
}

export function getLocalizedPrograms(programs: WorkoutProgram[], lang: SupportedLanguage): WorkoutProgram[] {
  return programs.map((p) => getLocalizedProgram(p, lang));
}

export function getLocalizedExercise(exercise: ExerciseItem, lang: SupportedLanguage): ExerciseItem {
  const trans = EXERCISE_TRANSLATIONS[exercise.id]?.[lang];
  if (!trans) return exercise;
  return {
    ...exercise,
    name: trans.name,
    category: (trans.categoryLabel as ExerciseItem['category']) || exercise.category,
    description: trans.description,
    instructions: trans.instructions,
    targetMuscles: trans.targetMuscles,
  };
}

export function getLocalizedExerciseCatalog(lang: SupportedLanguage): Record<string, ExerciseItem> {
  const result: Record<string, ExerciseItem> = {};
  for (const [id, item] of Object.entries(EXERCISE_CATALOG)) {
    result[id] = getLocalizedExercise(item, lang);
  }
  return result;
}

export function getLocalizedLeague(tier: LeagueTier, lang: SupportedLanguage): LeagueConfig {
  const base = LEAGUES_CONFIG[tier];
  const trans = LEAGUE_TIER_TRANSLATIONS[tier]?.[lang];
  if (!trans) return base;
  return {
    ...base,
    title: trans.title,
    description: trans.description,
    lore: trans.lore,
  };
}

export function getLocalizedLevel(level: FitnessLevel, lang: SupportedLanguage): string {
  if (lang === 'en') {
    switch (level) {
      case 'pemula':
        return 'Beginner';
      case 'menengah':
        return 'Intermediate';
      case 'mahir':
        return 'Advanced';
      default:
        return level;
    }
  }
  switch (level) {
    case 'pemula':
      return 'Pemula';
    case 'menengah':
      return 'Menengah';
    case 'mahir':
      return 'Mahir';
    default:
      return level;
  }
}

export function getLocalizedGoal(goal: FitnessGoal, lang: SupportedLanguage): string {
  if (lang === 'en') {
    switch (goal) {
      case 'otot':
        return 'Muscle Building';
      case 'kurus':
        return 'Fat Loss';
      case 'stamina':
        return 'Endurance & Mobility';
      default:
        return goal;
    }
  }
  switch (goal) {
    case 'otot':
      return 'Bentuk Otot';
    case 'kurus':
      return 'Bakar Lemak';
    case 'stamina':
      return 'Stamina & Mobilitas';
    default:
      return goal;
  }
}
