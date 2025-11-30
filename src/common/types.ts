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
  first_rate: number;   // 0.0 ~ 1.0
  top2_rate: number;    // 0.0 ~ 1.0
  fourth_rate: number;  // 0.0 ~ 1.0
  avg_rank: number; // ← 추가!
};