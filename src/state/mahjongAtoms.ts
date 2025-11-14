// src/mahjong/state/mahjongAtoms.ts
import { atom } from "jotai";
import type { Player, Round, PlayerStats } from "../common/types";

const todayStr = () => new Date().toISOString().slice(0, 10);

// 초기 데이터
const initialPlayers: Player[] = [
  { id: 1, name: "민수" },
  { id: 2, name: "지훈" },
  { id: 3, name: "수진" },
  { id: 4, name: "영희" },
];

export const playersAtom = atom<Player[]>(initialPlayers);

export const datePlayersAtom = atom<Record<string, number[]>>({
  [todayStr()]: initialPlayers.map((p) => p.id),
});

export const selectedDateAtom = atom<string>(todayStr());

// 이 라운드에 실제로 선택된 플레이어(최대 4명)
export const selectedPlayerIdsAtom = atom<number[]>(
  initialPlayers.slice(0, 4).map((p) => p.id)
);

// 이 라운드 등수 순서
export const currentRankingAtom = atom<number[]>(
  initialPlayers.slice(0, 4).map((p) => p.id)
);

// 전체 라운드 목록
export const roundsAtom = atom<Round[]>([]);

// 편의용: id → Player Map
export const playerMapAtom = atom((get) => {
  const players = get(playersAtom);
  return players.reduce<Record<number, Player>>((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});
});

// 현재 선택 날짜 기준 파티 멤버
export const currentDatePlayersAtom = atom<Player[]>((get) => {
  //const players = get(playersAtom);
  const map = get(playerMapAtom);
  const datePlayers = get(datePlayersAtom);
  const selectedDate = get(selectedDateAtom);

  const ids = datePlayers[selectedDate] ?? [];
  return ids.map((id) => map[id]).filter(Boolean);
});

// 선택 날짜 기준 통계
export const statsByPlayerAtom = atom<PlayerStats[]>((get) => {
  const players = get(playersAtom);
  const rounds = get(roundsAtom);
  const selectedDate = get(selectedDateAtom);

  const statsMap = new Map<
    number,
    { games: number; firstCount: number; sumRank: number }
  >();

  const filtered = rounds.filter((r) => r.date === selectedDate);

  filtered.forEach((round) => {
    round.ranking.forEach((pid, index) => {
      const rank = index + 1;
      const cur =
        statsMap.get(pid) ?? { games: 0, firstCount: 0, sumRank: 0 };
      cur.games += 1;
      cur.sumRank += rank;
      if (rank === 1) cur.firstCount += 1;
      statsMap.set(pid, cur);
    });
  });

  return players.map((p) => {
    const s = statsMap.get(p.id);
    if (!s)
      return { player: p, games: 0, firstCount: 0, avgRank: null };
    return {
      player: p,
      games: s.games,
      firstCount: s.firstCount,
      avgRank: s.sumRank / s.games,
    };
  });
});
