// src/mahjong/hooks/usePlayersActions.ts
import { useCallback, useEffect } from 'react';
import { useAtom } from 'jotai';
import { playersAtom } from '../state/mahjongAtoms';
import type { Player } from '../common/types';

export function usePlayersActions() {
  const [, setPlayers] = useAtom(playersAtom);

  const reloadPlayers = useCallback(async () => {
    try {
      const res = await fetch('/api/players');
      if (!res.ok) throw new Error('failed to fetch players');

      const data = await res.json();
      const safe = Array.isArray(data) ? (data as Player[]) : [];
      setPlayers(safe);
    } catch (e) {
      console.error(e);
      setPlayers([]);
    }
  }, [setPlayers]);

  useEffect(() => {
    reloadPlayers();
  }, [reloadPlayers]);

  return { reloadPlayers };
}
