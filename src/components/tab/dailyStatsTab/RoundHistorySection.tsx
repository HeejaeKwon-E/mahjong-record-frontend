import { useState } from 'react';
import { useAtomValue } from 'jotai';
import type { Round } from '../../../common/types';
import {
  playerMapAtom,
  roundsAtom,
  selectedDateAtom,
  selectedPlayerIdsAtom,
  serverTodayAtom,
} from '../../../state/mahjongAtoms';

const RANK_LABELS = ['1위', '2위', '3위', '4위'] as const;
const RANK_TONES = [
  'text-gold',
  'text-silver',
  'text-bronze',
  'text-vermilion',
] as const;

type RoundHistorySectionProps = {
  reloadDateData: (dateOverride?: string) => Promise<void>;
  showSnackbar: (
    msg: string,
    severity: 'success' | 'error' | 'info' | 'warning',
  ) => void;
};

/**
 * 일별 라운드 기록을 모바일 카드 형태로 표시합니다.
 *
 * 기존 기능은 그대로 유지합니다.
 * - 서버에서 받은 created_at 기준 시간 표시
 * - 오늘 날짜에서만 삭제 가능
 * - DELETE /api/rounds/:id 호출 후 서버 데이터 재조회
 *
 * MUI Table/Dialog는 제거하고 Tailwind + 접근성 속성을 가진 간단한 modal overlay를
 * 사용합니다. 삭제가 진행 중일 때는 버튼을 잠가 중복 DELETE 요청도 방지합니다.
 */
export function RoundHistorySection({
  reloadDateData,
  showSnackbar,
}: RoundHistorySectionProps) {
  const rounds = useAtomValue(roundsAtom);
  const selectedDate = useAtomValue(selectedDateAtom);
  const playerMap = useAtomValue(playerMapAtom);
  const selectedPlayerIds = useAtomValue(selectedPlayerIdsAtom);
  const serverToday = useAtomValue(serverTodayAtom);
  const [deleteTarget, setDeleteTarget] = useState<Round | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedPlayerIdSet = new Set(selectedPlayerIds);
  const filtered = rounds
    .filter((round) => round.date === selectedDate)
    .filter(
      (round) =>
        selectedPlayerIdSet.size === 0 ||
        round.ranking.some((playerId) => selectedPlayerIdSet.has(playerId)),
    );
  const isToday = selectedDate === serverToday;

  const formatTime = (round: Round) => {
    if (!round.created_at) return '-';
    return new Date(round.created_at).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/rounds/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '라운드 삭제 실패');
      }

      // 현재 보고 있는 날짜를 명시해 stale closure 가능성을 없앱니다.
      await reloadDateData(selectedDate);
      setDeleteTarget(null);
      showSnackbar('라운드가 삭제되었습니다.', 'success');
    } catch (error) {
      console.error(error);
      setDeleteTarget(null);
      showSnackbar('라운드 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-[680px]">
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold">라운드 기록</h2>
            <p className="mt-1 text-[12px] text-muted">
              {selectedPlayerIdSet.size > 0
                ? '선택한 멤버가 참가한 라운드만 표시됩니다.'
                : '최근 라운드가 위에 표시됩니다.'}
            </p>
          </div>
          <span className="font-mono text-[11px] text-muted">
            {filtered.length}게임
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-card border border-dashed border-border px-5 py-9 text-center text-[12px] text-muted">
            {selectedPlayerIdSet.size > 0
              ? '선택한 멤버의 라운드 기록이 없습니다.'
              : '이 날짜에는 기록된 라운드가 없습니다.'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((round) => (
              <article
                key={round.id}
                className="rounded-card border border-border bg-surface px-3.5 py-3 shadow-[var(--shadow-1)]"
              >
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <time className="font-mono text-[12px] font-semibold text-muted">
                      {formatTime(round)}
                    </time>
                    <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                      #{round.id}
                    </span>
                  </div>

                  {isToday && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(round)}
                      className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-vermilion/10 hover:text-vermilion active:scale-95"
                      aria-label={`${formatTime(round)} 라운드 삭제`}
                    >
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="m19 6-1 14H6L5 6" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
                  {round.ranking.map((playerId, index) => {
                    // 필터가 켜진 카드 안에서는 선택한 사람의 실제 등수만 보여줍니다.
                    // 삭제 확인창은 전체 라운드 삭제의 영향을 알 수 있도록 네 명을 유지합니다.
                    if (
                      selectedPlayerIdSet.size > 0 &&
                      !selectedPlayerIdSet.has(playerId)
                    ) {
                      return null;
                    }

                    const playerName = playerMap[playerId]?.name ?? '?';

                    return (
                      <div
                        key={`${round.id}-${index}`}
                        className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-2 rounded-xl bg-surface-2 px-2.5 py-2"
                      >
                        <span
                          className={`text-[11px] font-black ${RANK_TONES[index]}`}
                        >
                          {RANK_LABELS[index]}
                        </span>
                        {/* 등수 라벨은 왼쪽에 고정하고, 이름 영역 안에서는 항상 가운데 정렬합니다. */}
                        <span className="min-w-0 truncate text-center text-[13px] font-semibold">
                          {playerName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-3 backdrop-blur-[2px] sm:items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-round-title"
            className="w-full max-w-[430px] rounded-[22px] border border-border bg-surface p-5 shadow-2xl"
          >
            <h3 id="delete-round-title" className="text-[17px] font-extrabold">
              이 라운드를 삭제할까요?
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              {formatTime(deleteTarget)} 기록을 삭제합니다. 삭제 후에는 되돌릴
              수 없습니다.
            </p>

            <div className="mt-4 space-y-1.5 rounded-xl bg-surface-2 p-3">
              {deleteTarget.ranking.map((playerId, index) => (
                <div
                  key={playerId}
                  className="flex items-center justify-between gap-3 text-[13px]"
                >
                  <span className={`font-bold ${RANK_TONES[index]}`}>
                    {RANK_LABELS[index]}
                  </span>
                  <span className="font-semibold">
                    {playerMap[playerId]?.name ?? '?'}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="h-11 rounded-xl border border-border bg-surface-2 text-[14px] font-bold transition hover:bg-border/35 disabled:cursor-not-allowed disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={isDeleting}
                className="h-11 rounded-full bg-vermilion text-[14px] font-semibold text-on-vermilion transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
