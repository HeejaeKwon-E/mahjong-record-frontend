// src/mahjong/hooks/useServerSync.ts
import { useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import {
  playersAtom,
  roundsAtom,
  selectedDateAtom,
  selectedPlayerIdsAtom,
  currentRankingAtom,
} from "../state/mahjongAtoms";
import type { Player, Round } from "../common/types";

export function useServerSync() {
  const [selectedDate] = useAtom(selectedDateAtom);
  const [, setPlayers] = useAtom(playersAtom);
  const [, setRounds] = useAtom(roundsAtom);
  const [, setSelectedPlayerIds] = useAtom(selectedPlayerIdsAtom);
  const [, setCurrentRanking] = useAtom(currentRankingAtom);

  // 전체 플레이어 (앱 처음 켤 때 한 번)
  const reloadPlayers = useCallback(async () => {
    try {
      const res = await fetch("/api/players");
      if (!res.ok) throw new Error("failed to fetch players");
      const data = await res.json();
      const safe = Array.isArray(data) ? (data as Player[]) : [];
      setPlayers(safe);
    } catch (e) {
      console.error(e);
      setPlayers([]);
    }
  }, [setPlayers]);

  // 선택된 날짜 기준 라운드 + 기본 선택 플레이어 설정
  const reloadDateData = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/rounds?date=${encodeURIComponent(selectedDate)}`
      );
      if (!res.ok) throw new Error("failed to fetch rounds");
      const data = await res.json();
      const safeRounds = Array.isArray(data) ? (data as Round[]) : [];

      setRounds(safeRounds);

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
      setSelectedPlayerIds([]);
      setCurrentRanking([]);
    }
  }, [selectedDate, setRounds, setSelectedPlayerIds, setCurrentRanking]);

  useEffect(() => {
    reloadPlayers();
  }, [reloadPlayers]);

  useEffect(() => {
    reloadDateData();
  }, [reloadDateData]);

  return { reloadPlayers, reloadDateData };
}
