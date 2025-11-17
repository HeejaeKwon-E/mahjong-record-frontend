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
};
