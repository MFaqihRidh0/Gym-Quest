import type { LeagueConfig, LeagueTier, LeaderboardCompetitor, ZoneType } from './types';

export const LEAGUES_CONFIG: Record<LeagueTier, LeagueConfig> = {
  iron: {
    id: 'iron',
    order: 1,
    name: 'Iron Initiate',
    title: 'Liga Besi Pemula',
    badgeIcon: '🛡️',
    badgeColor: 'text-slate-400 border-slate-500/40 bg-slate-500/15',
    accentColor: '#94a3b8',
    glowStyle: 'rgba(148, 163, 184, 0.25)',
    description: 'Kasta perintis bagi pengembara yang baru memulai disiplin latihan rumahan.',
    lore: 'Besi yang ditempa dalam kesunyian membentuk fondasi kekuatan sejati.',
    minExpBenchmark: 250,
  },
  bronze: {
    id: 'bronze',
    order: 2,
    name: 'Bronze Brawler',
    title: 'Liga Perunggu Petarung',
    badgeIcon: '🥉',
    badgeColor: 'text-amber-500 border-amber-600/40 bg-amber-600/15',
    accentColor: '#d97706',
    glowStyle: 'rgba(217, 119, 6, 0.3)',
    description: 'Kasta petarung tangguh yang mulai menguasai ritme dan ketahanan fisik konsisten.',
    lore: 'Ketahanan dibangun melalui setiap repetisi yang membakar otot tanpa menyerah.',
    minExpBenchmark: 650,
  },
  silver: {
    id: 'silver',
    order: 3,
    name: 'Silver Striker',
    title: 'Liga Perak Penyerang',
    badgeIcon: '🥈',
    badgeColor: 'text-cyan-400 border-cyan-400/40 bg-cyan-400/15',
    accentColor: '#00e5ff',
    glowStyle: 'rgba(0, 229, 255, 0.35)',
    description: 'Kasta atlet berteknik tinggi dengan mobilitas lincah dan komitmen kuat.',
    lore: 'Kecepatan dan presisi gerakan biomekanik menjadi senjata utama di arena.',
    minExpBenchmark: 1200,
  },
  gold: {
    id: 'gold',
    order: 4,
    name: 'Gold Gladiator',
    title: 'Liga Emas Jawara',
    badgeIcon: '🥇',
    badgeColor: 'text-yellow-400 border-yellow-400/50 bg-yellow-400/15',
    accentColor: '#ffd600',
    glowStyle: 'rgba(255, 214, 0, 0.4)',
    description: 'Kasta jawara veteran yang mendominasi program latihan intensitas tinggi.',
    lore: 'Kilau emas adalah saksi dedikasi tanpa kompromi menembus batas rasa lelah.',
    minExpBenchmark: 2100,
  },
  titan: {
    id: 'titan',
    order: 5,
    name: 'Titan Colossus',
    title: 'Liga Titan Puncak',
    badgeIcon: '👑',
    badgeColor: 'text-fuchsia-400 border-fuchsia-400/60 bg-fuchsia-500/20',
    accentColor: '#e879f9',
    glowStyle: 'rgba(232, 121, 249, 0.45)',
    description: 'Piramida tertinggi kekuatan fisik. Tempat para legenda abadi GymQuest berkumpul.',
    lore: 'Hanya mereka yang memiliki disiplin mutlak yang mampu mempertahankan tahta Titan.',
    minExpBenchmark: 3500,
  },
};

export const LEAGUE_TIERS_ORDER: LeagueTier[] = ['iron', 'bronze', 'silver', 'gold', 'titan'];

/**
 * Menentukan zona posisi kontestan dalam tabel 11 peserta:
 * - Rank 1 - 3: Promosi (Naik Liga)
 * - Rank 4 - 8: Bertahan (Menetap)
 * - Rank 9 - 11: Degradasi (Turun Liga)
 */
export function getRankZone(rank: number): ZoneType {
  if (rank <= 3) return 'promotion';
  if (rank <= 8) return 'safe';
  return 'demotion';
}

export function getNextLeague(current: LeagueTier): LeagueTier {
  const idx = LEAGUE_TIERS_ORDER.indexOf(current);
  if (idx < LEAGUE_TIERS_ORDER.length - 1) {
    return LEAGUE_TIERS_ORDER[idx + 1];
  }
  return current; // Sudah di Titan, tetap Titan
}

export function getPreviousLeague(current: LeagueTier): LeagueTier {
  const idx = LEAGUE_TIERS_ORDER.indexOf(current);
  if (idx > 0) {
    return LEAGUE_TIERS_ORDER[idx - 1];
  }
  return current; // Sudah di Iron, tidak bisa turun lagi
}

// Pool nama kontestan rival untuk membangun simulasi kompetisi 11 peserta
const RIVAL_NAMES_POOL = [
  { name: 'VortexValkyrie', title: 'Ironcore Striker', avatar: '⚡' },
  { name: 'CyberSpartan', title: 'Kettlebell Knight', avatar: '🛡️' },
  { name: 'AeroPhoenix', title: 'Cardio Beast', avatar: '🔥' },
  { name: 'ShadowRonin', title: 'Core Master', avatar: '🗡️' },
  { name: 'NovaGladiator', title: 'Hypertrophy Ace', avatar: '💪' },
  { name: 'TitanForge', title: 'Heavy Lifter', avatar: '⚙️' },
  { name: 'QuantumPulse', title: 'HIIT Specialist', avatar: '🌀' },
  { name: 'AstraViper', title: 'Agility Crusader', avatar: '🐍' },
  { name: 'GigaChad_99', title: 'Calisthenics God', avatar: '🦁' },
  { name: 'ZenMonk_ID', title: 'Plank Champion', avatar: '🧘' },
  { name: 'BlazeStriker', title: 'Endurance Pioneer', avatar: '🦅' },
  { name: 'KuroKyojin', title: 'Power Surge', avatar: '🐲' },
];

/**
 * Generate 10 rival kompetitor di sekitar EXP benchmark liga agar persaingan ketat dan seru.
 */
export function generateCompetitorsForLeague(
  leagueId: LeagueTier,
  userWeeklyExp: number,
  userStreak: number = 1,
  username: string = 'Kamu (Knight-01)',
): LeaderboardCompetitor[] {
  const config = LEAGUES_CONFIG[leagueId];
  const baseBenchmark = config.minExpBenchmark;

  // Pilih 10 rival acak dari pool
  const shuffled = [...RIVAL_NAMES_POOL].sort(() => 0.5 - Math.random()).slice(0, 10);

  // Variasi multiplier EXP untuk rival di rank 1-10
  const expMultipliers = [1.6, 1.45, 1.3, 1.15, 1.0, 0.9, 0.8, 0.7, 0.55, 0.4];

  const rivalCompetitors: LeaderboardCompetitor[] = shuffled.map((rival, index) => {
    const mult = expMultipliers[index];
    const jitter = Math.floor(Math.random() * 80) - 40;
    const weeklyExp = Math.max(80, Math.round(baseBenchmark * mult + jitter));
    const level = Math.max(1, Math.round(config.order * 3 + index));
    const totalExp = weeklyExp * 4 + Math.floor(Math.random() * 500);

    return {
      id: `rival-${rival.name.toLowerCase()}-${index}`,
      username: rival.name,
      title: rival.title,
      avatar: rival.avatar,
      level,
      weeklyExp,
      totalExp,
      isUser: false,
      streakDays: Math.floor(Math.random() * 8) + 1,
    };
  });

  // User competitor
  const userCompetitor: LeaderboardCompetitor = {
    id: 'user-current',
    username,
    title: config.title,
    avatar: '⚔️',
    level: Math.max(1, Math.round(config.order * 2)),
    weeklyExp: userWeeklyExp,
    totalExp: userWeeklyExp,
    isUser: true,
    streakDays: userStreak,
  };

  // Gabungkan dan urutkan berdasarkan weeklyExp tertinggi
  const all = [...rivalCompetitors, userCompetitor];
  all.sort((a, b) => b.weeklyExp - a.weeklyExp);

  return all;
}
