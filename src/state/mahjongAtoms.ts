// src/mahjong/state/mahjongAtoms.ts
import { atom } from 'jotai';
import type { Player, Round, PlayerStats } from '../common/types';

const todayStr = () => new Date().toISOString().slice(0, 10);

export const playersAtom = atom<Player[]>([]);

// 그 날짜에 기록이 있는 플레이어 목록 (API: /players/by-date)
export const datePlayersAtom = atom<Player[]>([]);

export const selectedDateAtom = atom<string>(todayStr());

// 이번 라운드에 실제로 선택된 플레이어 (0~4명)
export const selectedPlayerIdsAtom = atom<number[]>([]);

// 내부에 실제 순서를 저장하는 atom
const rankingBaseAtom = atom<number[]>([]);

// 읽기: 항상 selected 안에 있는 애들만, 순서 유지 + 새로 선택된 애는 뒤에 붙이기
export const currentRankingAtom = atom(
  (get) => {
    const selected = get(selectedPlayerIdsAtom) ?? [];
    const base = get(rankingBaseAtom) ?? [];

    // 1) 기존 순서 중에서 아직 선택된 애들만 남기고
    const filtered = base.filter((id) => selected.includes(id));
    // 2) 새로 선택된 애들(기존에 없던) 뒤에 붙이기
    const newOnes = selected.filter((id) => !filtered.includes(id));

    return [...filtered, ...newOnes];
  },
  (get, set, action: number[] | ((prev: number[]) => number[])) => {
    const prev = get(rankingBaseAtom) ?? [];

    const next =
      typeof action === 'function'
        ? (action as (prev: number[]) => number[])(prev)
        : action; // ← 배열이 오면 그대로 사용

    set(rankingBaseAtom, next);
  },
);
// 전체 라운드 목록
export const roundsAtom = atom<Round[]>([]);

// 편의용: id → Player Map
export const playerMapAtom = atom((get) => {
  const players = get(playersAtom) ?? []; // 혹시라도 null이면 [] 처리
  return players.reduce<Record<number, Player>>((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});
});

// 선택 날짜 기준 통계
export const statsByPlayerAtom = atom<PlayerStats[]>((get) => {
  const datePlayers = get(datePlayersAtom) ?? []; // 🔹 오늘 기록 있는 플레이어들
  const rounds = get(roundsAtom) ?? [];
  const selectedDate = get(selectedDateAtom);

  const statsMap = new Map<
    number,
    { games: number; firstCount: number; sumRank: number }
  >();

  const filtered = rounds.filter((r) => r.date === selectedDate);

  filtered.forEach((round) => {
    round.ranking.forEach((pid, index) => {
      const rank = index + 1;
      const cur = statsMap.get(pid) ?? { games: 0, firstCount: 0, sumRank: 0 };
      cur.games += 1;
      cur.sumRank += rank;
      if (rank === 1) cur.firstCount += 1;
      statsMap.set(pid, cur);
    });
  });

  // 🔸 오늘 기록이 있는 플레이어들(datePlayers)에 대해서만 통계 생성
  return datePlayers
    .filter((p) => statsMap.has(p.id))
    .map((p) => {
      const s = statsMap.get(p.id)!;
      return {
        player: p,
        games: s.games,
        firstCount: s.firstCount,
        avgRank: s.sumRank / s.games,
      };
    })
    .sort((a, b) => b.firstCount - a.firstCount); // ← 여기가 추가됨!
});
