import { useCallback, useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import type { Round } from '../common/types';
import {
  currentRankingAtom,
  roundsAtom,
  selectedDateAtom,
  selectedPlayerIdsAtom,
} from '../state/mahjongAtoms';

/**
 * 선택 날짜의 라운드/참가자를 서버와 동기화합니다.
 *
 * 핵심 변경점
 * 1. reloadDateData(dateOverride)를 허용해 날짜 변경 직후 이전 closure를 읽는 문제를 없앱니다.
 * 2. AbortController로 이전 요청을 취소해 늦게 도착한 응답이 최신 날짜 상태를 덮지 못하게 합니다.
 * 3. 서버 재조회 시 직전 라운드의 "멤버"만 복원하고, 이번 라운드 순위 초안은 비웁니다.
 * 4. 날짜별 참가자는 라운드 응답에서 파생해 `/api/players/by-date` 중복 요청을 없앱니다.
 */
export function useServerSync() {
  const selectedDate = useAtomValue(selectedDateAtom);
  const setRounds = useSetAtom(roundsAtom);
  const setSelectedPlayerIds = useSetAtom(selectedPlayerIdsAtom);
  const setCurrentRanking = useSetAtom(currentRankingAtom);
  const requestControllerRef = useRef<AbortController | null>(null);

  const reloadDateData = useCallback(
    async (dateOverride?: string) => {
      const targetDate = (dateOverride ?? selectedDate).trim();
      if (!targetDate) return;

      // 날짜를 빠르게 이동할 때 이전 fetch가 나중에 완료되는 race condition을 차단합니다.
      requestControllerRef.current?.abort();
      const controller = new AbortController();
      requestControllerRef.current = controller;

      try {
        const roundsRes = await fetch(
          `/api/rounds/by-date?date=${encodeURIComponent(targetDate)}`,
          {
            signal: controller.signal,
          },
        );

        if (!roundsRes.ok) throw new Error('failed to fetch rounds');

        const roundsData = await roundsRes.json();

        const safeRounds = Array.isArray(roundsData)
          ? (roundsData as Round[])
          : [];

        setRounds(safeRounds);

        // 최근 라운드의 네 명은 "세션 멤버"로만 복원합니다.
        // 다음 라운드 순위는 사용자가 새로 탭하도록 반드시 빈 배열로 시작합니다.
        const latestParticipants = safeRounds[0]?.ranking?.slice(0, 4) ?? [];
        setSelectedPlayerIds(latestParticipants);
        setCurrentRanking([]);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;

        console.error(error);
        setRounds([]);
        setSelectedPlayerIds([]);
        setCurrentRanking([]);
      }
    },
    [selectedDate, setCurrentRanking, setRounds, setSelectedPlayerIds],
  );

  useEffect(() => {
    void reloadDateData();

    return () => {
      requestControllerRef.current?.abort();
    };
  }, [reloadDateData]);

  return { reloadDateData };
}
