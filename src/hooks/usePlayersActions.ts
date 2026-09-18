import { useCallback, useEffect, useRef } from 'react';
import { useSetAtom } from 'jotai';
import { playersAtom } from '../state/mahjongAtoms';
import type { Player } from '../common/types';

/**
 * 전체 플레이어 목록을 명시적으로 다시 불러오는 액션입니다.
 *
 * 자동 로딩은 앱 셸 한 곳에서만 실행합니다. 기록 탭이 다시 mount될 때마다
 * GET /api/players가 반복되던 구조를 피하고, 플레이어 추가 성공 시에만 이 액션을
 * 재사용합니다.
 */
export function usePlayersActions() {
  const setPlayers = useSetAtom(playersAtom);
  const requestControllerRef = useRef<AbortController | null>(null);

  const reloadPlayers = useCallback(async () => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;

    try {
      const res = await fetch('/api/players', { signal: controller.signal });
      if (!res.ok) throw new Error('failed to fetch players');

      const data = await res.json();
      const safe = Array.isArray(data) ? (data as Player[]) : [];
      setPlayers(safe);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      console.error(e);
      setPlayers([]);
    }
  }, [setPlayers]);

  // 탭 전환이나 개발 모드 StrictMode 재마운트 시 진행 중인 요청을 정리합니다.
  useEffect(() => {
    return () => requestControllerRef.current?.abort();
  }, []);

  return { reloadPlayers };
}
