export type LeagueTier = 'iron' | 'bronze' | 'silver' | 'gold' | 'titan';

export type ZoneType = 'promotion' | 'safe' | 'demotion';

export interface LeagueConfig {
  id: LeagueTier;
  order: number; // 1 to 5
  name: string;
  title: string;
  badgeIcon: string;
  badgeColor: string; // Tailwind color class or hex
  accentColor: string; // Neon accent hex
  glowStyle: string;
  description: string;
  lore: string;
  minExpBenchmark: number; // Reference standard for competitor range
}

export interface LeaderboardCompetitor {
  id: string;
  username: string;
  title: string;
  avatar: string;
  level: number;
  weeklyExp: number;
  totalExp: number;
  isUser: boolean;
  streakDays: number;
}

export interface SeasonEvaluationResult {
  seasonNumber: number;
  oldLeague: LeagueTier;
  newLeague: LeagueTier;
  finalRank: number;
  finalWeeklyExp: number;
  outcome: 'promoted' | 'retained' | 'relegated';
  evaluatedAt: number;
}

export interface LeagueRoomData {
  roomId: string;
  roomCode: string;
  leagueTier: LeagueTier;
  seasonStartAt: string;
  seasonEndAt: string;
  memberCount: number;
  maxMembers: number;
  weeklyExp?: number;
}

export interface WeeklySeasonState {
  seasonNumber: number;
  leagueId: LeagueTier;
  seasonStartDate: number; // timestamp
  seasonEndDate: number; // timestamp (startDate + 7 * 24 * 60 * 60 * 1000)
  competitors: LeaderboardCompetitor[];
  lastEvaluation?: SeasonEvaluationResult | null;
  roomData?: LeagueRoomData | null;
}

