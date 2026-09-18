import { useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  currentRankingAtom,
  playersAtom,
  selectedPlayerIdsAtom,
} from '../../../state/mahjongAtoms';
import { usePlayersActions } from '../../../hooks/usePlayersActions';

type FeedbackSeverity = 'success' | 'error' | 'info' | 'warning';

type PlayerSectionProps = {
  showSnackbar: (message: string, severity: FeedbackSeverity) => void;
};

const NAME_REGEX = /^[가-힣]{2}\d{2}$/;

/**
 * 오늘 같이 플레이하는 세션 멤버 4명을 고르는 영역입니다.
 *
 * 이 선택은 "이번 라운드 등수"와 분리되어 있으므로 한 번 4명을 구성하면
 * 매 라운드마다 다시 참가자를 고를 필요가 없습니다.
 */
export function PlayerSection({ showSnackbar }: PlayerSectionProps) {
  const { reloadPlayers } = usePlayersActions();
  const players = useAtomValue(playersAtom);
  const [sessionPlayerIds, setSessionPlayerIds] = useAtom(
    selectedPlayerIdsAtom,
  );
  const setDraftRanking = useSetAtom(currentRankingAtom);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [expandedOverride, setExpandedOverride] = useState<boolean | null>(
    null,
  );

  /**
   * 서버 동기화로 기존 멤버가 복원되면 기본적으로 접어 기록 입력 공간을 확보합니다.
   * 아직 멤버가 없거나 사용자가 직접 펼친 경우에는 목록을 계속 보여줍니다.
   */
  const isExpanded = expandedOverride ?? sessionPlayerIds.length === 0;
  const selectedPlayerNames = sessionPlayerIds
    .map((playerId) => players.find((player) => player.id === playerId)?.name)
    .filter((name): name is string => Boolean(name));

  const handleTogglePlayer = (playerId: number) => {
    // 빈 세션에서 첫 멤버를 고를 때 목록이 즉시 접히지 않도록 수동 펼침으로 고정합니다.
    setExpandedOverride(true);
    setSessionPlayerIds((previous) => {
      const isSelected = previous.includes(playerId);

      if (isSelected) {
        // 세션에서 빠진 사람은 작성 중인 등수에서도 함께 제거해야 합니다.
        setDraftRanking((ranking) => ranking.filter((id) => id !== playerId));
        return previous.filter((id) => id !== playerId);
      }

      if (previous.length >= 4) {
        showSnackbar('세션 참가자는 최대 4명까지 선택할 수 있어요.', 'warning');
        return previous;
      }

      return [...previous, playerId];
    });
  };

  const handleAddPlayer = async () => {
    const trimmedName = newPlayerName.trim();

    if (!NAME_REGEX.test(trimmedName)) {
      showSnackbar(
        '이름은 한글 2자 + 연도 2자리로 입력해주세요. 예: 희재93',
        'warning',
      );
      return;
    }

    try {
      setIsAdding(true);
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '플레이어 추가 실패');
      }

      await reloadPlayers();
      setNewPlayerName('');
      setShowAddForm(false);
      showSnackbar('플레이어를 추가했습니다.', 'success');
    } catch (error) {
      console.error(error);
      showSnackbar('플레이어 추가 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <section aria-labelledby="session-player-title">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls="session-player-content"
        onClick={() => setExpandedOverride(!isExpanded)}
        className="mb-3 flex w-full items-center gap-3 rounded-xl py-1 text-left transition hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/30"
      >
        <div className="min-w-0 flex-1">
          <h2
            id="session-player-title"
            className="text-[15px] font-bold text-text"
          >
            오늘의 멤버
          </h2>
          {isExpanded ? (
            <p className="mt-1 text-[12px] leading-5 text-muted">
              같이 치는 4명은 유지되고, 매 판에는 등수만 다시 입력합니다.
            </p>
          ) : (
            <p className="mt-1 truncate text-[12px] leading-5 text-muted">
              {selectedPlayerNames.length > 0
                ? selectedPlayerNames.join(' · ')
                : '멤버를 선택해주세요.'}
            </p>
          )}
        </div>
        <span className="shrink-0 text-[12px] font-semibold tabular-nums text-muted">
          {sessionPlayerIds.length} / 4
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isExpanded && (
        <div id="session-player-content">
          <div className="grid grid-cols-2 gap-2.5">
            {players.map((player) => {
              const selected = sessionPlayerIds.includes(player.id);
              const disabled = !selected && sessionPlayerIds.length >= 4;

              return (
                <button
                  key={player.id}
                  type="button"
                  aria-pressed={selected}
                  disabled={disabled}
                  data-selected={selected}
                  onClick={() => handleTogglePlayer(player.id)}
                  className="player-tile min-h-14 rounded-card px-3 py-3 text-left text-sm font-semibold transition-transform active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <span className="block truncate">{player.name}</span>
                  <span
                    className={`mt-1 block text-[11px] font-medium ${selected ? 'text-[var(--jade-strong)]/75' : 'text-muted'}`}
                  >
                    {selected ? '세션 참가 중' : '탭해서 참가'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-border pt-3">
            {!showAddForm ? (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-muted transition hover:bg-surface-2 hover:text-text"
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  ＋
                </span>
                플레이어 추가
              </button>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={newPlayerName}
                    onChange={(event) => setNewPlayerName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void handleAddPlayer();
                      if (event.key === 'Escape') setShowAddForm(false);
                    }}
                    placeholder="희재93"
                    maxLength={4}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition placeholder:text-muted/60 focus:border-jade focus:ring-2 focus:ring-jade/15"
                  />
                  <button
                    type="button"
                    disabled={isAdding}
                    onClick={() => void handleAddPlayer()}
                    className="h-11 shrink-0 rounded-full bg-jade px-4 text-sm font-semibold text-on-jade transition hover:bg-jade-strong disabled:opacity-50"
                  >
                    {isAdding ? '추가 중' : '추가'}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-muted">
                    한글 2자 + 연도 2자리
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewPlayerName('');
                    }}
                    className="text-[11px] font-semibold text-muted hover:text-text"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
