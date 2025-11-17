// src/mahjong/hooks/useServerSync.ts
import { useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import {
  roundsAtom,
  selectedDateAtom,
  selectedPlayerIdsAtom,
  currentRankingAtom,
  datePlayersAtom,
} from '../state/mahjongAtoms';
import type { Player, Round } from '../common/types';

export function useServerSync() {
  const [selectedDate] = useAtom(selectedDateAtom);
  const [, setRounds] = useAtom(roundsAtom);
  const [, setDatePlayers] = useAtom(datePlayersAtom);
  const [, setSelectedPlayerIds] = useAtom(selectedPlayerIdsAtom);
  const [, setCurrentRanking] = useAtom(currentRankingAtom);

  // 선택된 날짜 기준 라운드 + 기본 선택 플레이어 설정
  const reloadDateData = useCallback(async () => {
    try {
      const [roundsRes, playersByDateRes] = await Promise.all([
        fetch(`/api/rounds/by-date?date=${encodeURIComponent(selectedDate)}`),
        fetch(`/api/players/by-date?date=${encodeURIComponent(selectedDate)}`),
      ]);

      if (!roundsRes.ok) throw new Error('failed to fetch rounds');
      if (!playersByDateRes.ok)
        throw new Error('failed to fetch players by date');

      const roundsData = await roundsRes.json();
      const playersByDateData = await playersByDateRes.json();

      const safeRounds = Array.isArray(roundsData)
        ? (roundsData as Round[])
        : [];
      const safeDatePlayers = Array.isArray(playersByDateData)
        ? (playersByDateData as Player[])
        : [];

      setRounds(safeRounds);
      setDatePlayers(safeDatePlayers);

      // 🔹 여기서 "그 날짜에 이미 기록된 플레이어"를 기본 selected로 세팅
      if (safeRounds.length > 0) {
        // repository에서 created_at DESC, id DESC 로 정렬해놨다면
        // safeRounds[0] 이 "가장 최근 라운드"
        const latest = safeRounds[0];

        // 최신 라운드에 나온 4명 (또는 그 이하)
        const defaultSelected = (latest.ranking ?? []).slice(0, 4);

        setSelectedPlayerIds(defaultSelected);
        setCurrentRanking(defaultSelected);
      } else {
        // 해당 날짜에 라운드 기록이 없으면 아무도 선택 안 된 상태
        setSelectedPlayerIds([]);
        setCurrentRanking([]);
      }
    } catch (e) {
      console.error(e);
      setRounds([]);
      setDatePlayers([]);
      setSelectedPlayerIds([]);
      setCurrentRanking([]);
    }
  }, [
    selectedDate,
    setRounds,
    setDatePlayers,
    setSelectedPlayerIds,
    setCurrentRanking,
  ]);

  useEffect(() => {
    reloadDateData();
  }, [reloadDateData]);

  return { reloadDateData };
}
