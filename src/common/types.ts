// src/mahjong/types.ts
export type Player = {
  id: number;
  name: string;
};

export type Round = {
  id: number;
  date: string; // YYYY-MM-DD
  ranking: number[]; // player ids
  created_at: string; // ISO datetime
};

export type PlayerStats = {
  player: Player;
  games: number;
  firstCount: number;
  avgRank: number | null;
  scoreSum: number; // ← 추가
};

// src/mahjong/common/types.ts (또는 stats.ts)
export type AllPlayerTotalStats = {
  player_id: number;
  name: string;
  games: number;
  first: number;
  second: number;
  third: number;
  fourth: number;
  first_rate: number; // 0.0 ~ 1.0
  top2_rate: number; // 0.0 ~ 1.0
  fourth_rate: number; // 0.0 ~ 1.0
  avg_rank: number; // ← 추가!
};

/** 개인 통계 API의 기간 요약 값입니다. */
export type PlayerStatsSummary = {
  games: number;
  avg_rank: number;
  first_rate: number;
  top2_rate: number;
  fourth_rate: number;
};

/** 개인 통계 API의 등수별 횟수입니다. */
export type RankCounts = {
  first: number;
  second: number;
  third: number;
  fourth: number;
};

/** 기존 API 호환성을 위해 유지하는 일별 집계입니다. */
export type DailyPlayerStats = RankCounts & {
  date: string;
  games: number;
  avg_rank: number;
};

/** 상세 화면에 노출하는 최신 라운드 한 건입니다. */
export type PlayerRecentRound = {
  round_id: number;
  date: string;
  rank: number;
  created_at: string;
};

/** GET /api/stats/players/:playerId/history 응답입니다. recent_rounds는 최대 50게임입니다. */
export type PlayerStatsHistory = {
  player: Player;
  summary: PlayerStatsSummary;
  rank_counts: RankCounts;
  daily: DailyPlayerStats[];
  recent_rounds: PlayerRecentRound[];
};
