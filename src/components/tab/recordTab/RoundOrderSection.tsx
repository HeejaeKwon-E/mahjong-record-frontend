import { useAtom } from 'jotai';
import { useAtomValue } from 'jotai';
import {
  currentRankingAtom,
  playerMapAtom,
  selectedDateAtom,
  selectedPlayerIdsAtom,
  serverTodayAtom,
} from '../../../state/mahjongAtoms';

type RoundOrderSectionProps = {
  isSaving: boolean;
  onSave: () => void;
};

const RANK_META = [
  { label: '1위', score: '0점', className: 'text-gold' },
  { label: '2위', score: '1점', className: 'text-silver' },
  { label: '3위', score: '3점', className: 'text-bronze' },
  { label: '4위', score: '6점', className: 'text-vermilion' },
] as const;

/**
 * 등수 입력을 위한 모바일 우선 UI입니다.
 * 드래그 대신 실제 최종 순위 순서대로 사람을 탭합니다.
 */
export function RoundOrderSection({
  isSaving,
  onSave,
}: RoundOrderSectionProps) {
  const sessionPlayerIds = useAtomValue(selectedPlayerIdsAtom);
  const [draftRanking, setDraftRanking] = useAtom(currentRankingAtom);
  const playerMap = useAtomValue(playerMapAtom);
  const selectedDate = useAtomValue(selectedDateAtom);
  const serverToday = useAtomValue(serverTodayAtom);

  const isToday = Boolean(serverToday) && selectedDate === serverToday;
  const sessionReady = sessionPlayerIds.length === 4;
  const rankingReady = draftRanking.length === 4;

  const handlePickRank = (playerId: number) => {
    if (!sessionReady || !isToday) return;

    setDraftRanking((previous) => {
      const index = previous.indexOf(playerId);

      // 이미 고른 사람을 다시 누르면 그 사람을 제거합니다.
      // 뒤 등수는 자동으로 앞으로 당겨지므로 수정 동작도 한 번의 탭으로 끝납니다.
      if (index !== -1) {
        return previous.filter((id) => id !== playerId);
      }

      if (previous.length >= 4) return previous;
      return [...previous, playerId];
    });
  };

  return (
    <section className="mt-7" aria-labelledby="ranking-title">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="ranking-title" className="text-[15px] font-bold text-text">
            이번 라운드 결과
          </h2>
          <p className="mt-1 text-[12px] leading-5 text-muted">
            1위부터 4위까지 순서대로 이름을 탭하세요.
          </p>
        </div>
        <span className="shrink-0 text-[12px] font-semibold tabular-nums text-muted">
          {draftRanking.length} / 4
        </span>
      </div>

      {!sessionReady ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/50 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-text">
            먼저 오늘의 멤버 4명을 골라주세요.
          </p>
          <p className="mt-1 text-xs text-muted">
            4명이 정해지면 바로 등수를 입력할 수 있습니다.
          </p>
        </div>
      ) : !isToday ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/50 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-text">
            과거 날짜는 기록을 추가할 수 없습니다.
          </p>
          <p className="mt-1 text-xs text-muted">
            일별 탭에서 기존 기록을 확인할 수 있어요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {sessionPlayerIds.map((playerId) => {
            const player = playerMap[playerId];
            if (!player) return null;

            const rankIndex = draftRanking.indexOf(playerId);
            const selected = rankIndex !== -1;
            const rankMeta = selected ? RANK_META[rankIndex] : null;
            const blocked = !selected && draftRanking.length >= 4;

            return (
              <button
                key={playerId}
                type="button"
                aria-pressed={selected}
                disabled={blocked}
                onClick={() => handlePickRank(playerId)}
                className={`min-h-[72px] rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.985] disabled:opacity-35 ${
                  selected
                    ? 'border-jade bg-jade-soft text-[var(--jade-strong)] shadow-[var(--shadow-1)]'
                    : 'border-border bg-surface text-text shadow-[var(--shadow-1)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg text-sm font-black ${
                      selected
                        ? `${rankMeta?.className} bg-black/[0.05]`
                        : 'bg-surface-2 text-muted'
                    }`}
                  >
                    {selected ? rankIndex + 1 : '·'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {player.name}
                    </span>
                    <span
                      className={`mt-0.5 block text-[11px] ${selected ? 'text-[var(--jade-strong)]/75' : 'text-muted'}`}
                    >
                      {rankMeta
                        ? `${rankMeta.label} · ${rankMeta.score}`
                        : `${draftRanking.length + 1}위로 선택`}
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isToday && sessionReady && draftRanking.length > 0 && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setDraftRanking([])}
            className="min-h-9 rounded-lg px-2 text-xs font-semibold text-muted transition hover:bg-surface-2 hover:text-vermilion"
          >
            등수 다시 입력
          </button>
        </div>
      )}

      {isToday && sessionReady && (
        <div className="sticky bottom-3 z-20 mt-5 rounded-card border border-border bg-surface/95 p-3 shadow-[var(--shadow-2)] backdrop-blur-md">
          <div className="mb-2.5 grid grid-cols-4 gap-1.5">
            {RANK_META.map((meta, index) => {
              const playerId = draftRanking[index];
              const player = playerId ? playerMap[playerId] : undefined;

              return (
                <div
                  key={meta.label}
                  className="min-w-0 rounded-lg bg-surface-2 px-1.5 py-2 text-center"
                >
                  <div className={`text-[10px] font-bold ${meta.className}`}>
                    {meta.label}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] font-semibold text-text">
                    {player?.name ?? '—'}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!rankingReady || isSaving}
            onClick={onSave}
            className="h-12 w-full rounded-full bg-jade text-[15px] font-semibold text-on-jade transition hover:bg-jade-strong active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {isSaving ? '저장 중…' : '이 라운드 저장'}
          </button>
        </div>
      )}
    </section>
  );
}
