import { atom } from 'jotai';
import type { Player, PlayerStats, Round } from '../common/types';

/** 서버에 등록된 전체 플레이어 목록 */
export const playersAtom = atom<Player[]>([]);

/** 서버가 알려준 오늘 날짜(YYYY-MM-DD) */
export const serverTodayAtom = atom<string | null>(null);

/** 사용자가 현재 보고 있는 날짜 */
export const selectedDateAtom = atom<string>('');

/**
 * 현재 대국 세션에 참가 중인 4명입니다.
 *
 * 이전 코드에서는 이 값과 이번 라운드 순위가 사실상 같은 상태처럼 움직였는데,
 * 저장 후 직전 순위가 다음 라운드의 초안으로 남는 문제가 생길 수 있었습니다.
 * 이제 이 atom은 "오늘 같이 치는 멤버"만 담당합니다.
 */
export const selectedPlayerIdsAtom = atom<number[]>([]);

/**
 * 아직 저장하지 않은 이번 라운드의 등수 초안입니다.
 * 배열 순서가 그대로 1위 → 4위입니다.
 * 저장에 성공하면 참가자 4명은 유지하고 이 배열만 비웁니다.
 */
export const currentRankingAtom = atom<number[]>([]);

/** 선택 날짜의 전체 라운드 */
export const roundsAtom = atom<Round[]>([]);

/** id → Player 빠른 조회용 Map */
export const playerMapAtom = atom((get) => {
  const players = get(playersAtom) ?? [];
  return players.reduce<Record<number, Player>>((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {});
});

/**
 * 선택 날짜에 실제 기록이 존재하는 플레이어 목록입니다.
 *
 * 이전에는 `/api/players/by-date`를 별도로 호출해 같은 날짜를 두 번 조회했습니다.
 * 라운드 응답에 이미 참가자 ID가 있으므로 전체 플레이어 목록과 조합해 파생하면
 * API 요청과 SQLite JOIN을 하나씩 줄이면서도 기존 화면 데이터 형식을 유지할 수 있습니다.
 */
export const datePlayersAtom = atom<Player[]>((get) => {
  const players = get(playersAtom);
  const rounds = get(roundsAtom);
  const selectedDate = get(selectedDateAtom);
  const participantIds = new Set<number>();

  for (const round of rounds) {
    if (round.date !== selectedDate) continue;
    for (const playerId of round.ranking) participantIds.add(playerId);
  }

  return players.filter((player) => participantIds.has(player.id));
});

/**
 * 선택 날짜 기준 일별 벌점 통계입니다.
 * 기존 규칙(1위 0 / 2위 1 / 3위 3 / 4위 6)은 그대로 유지합니다.
 */
export const statsByPlayerAtom = atom<PlayerStats[]>((get) => {
  const datePlayers = get(datePlayersAtom) ?? [];
  const rounds = get(roundsAtom) ?? [];
  const selectedDate = get(selectedDateAtom);
  const selectedPlayerIds = get(selectedPlayerIdsAtom);
  const selectedPlayerIdSet = new Set(selectedPlayerIds);

  const statsMap = new Map<
    number,
    { games: number; firstCount: number; sumRank: number; scoreSum: number }
  >();

  rounds
    .filter((round) => round.date === selectedDate)
    .forEach((round) => {
      round.ranking.forEach((playerId, index) => {
        const rank = index + 1;
        const score = rank === 1 ? 0 : rank === 2 ? 1 : rank === 3 ? 3 : 6;
        const current = statsMap.get(playerId) ?? {
          games: 0,
          firstCount: 0,
          sumRank: 0,
          scoreSum: 0,
        };

        current.games += 1;
        current.sumRank += rank;
        current.scoreSum += score;
        if (rank === 1) current.firstCount += 1;

        statsMap.set(playerId, current);
      });
    });

  return (
    datePlayers
      // 기록 탭에서 세션 멤버를 골랐다면 일별 요약도 같은 사람만 보여줍니다.
      // 아무도 고르지 않은 상태에서는 기존 동작대로 해당 날짜의 전체 참가자를 노출합니다.
      .filter(
        (player) =>
          selectedPlayerIdSet.size === 0 || selectedPlayerIdSet.has(player.id),
      )
      .filter((player) => statsMap.has(player.id))
      .map((player) => {
        const stats = statsMap.get(player.id)!;
        return {
          player,
          games: stats.games,
          firstCount: stats.firstCount,
          avgRank: stats.sumRank / stats.games,
          scoreSum: stats.scoreSum,
        };
      })
      .sort((a, b) => a.scoreSum - b.scoreSum)
  );
});
