import { useAtomValue } from 'jotai';
import {
  playerMapAtom,
  selectedDateAtom,
  selectedPlayerIdsAtom,
  statsByPlayerAtom,
} from '../../../state/mahjongAtoms';
import { DailyScoreChart } from './DailyScoreChart';

const RANK_MARKS = ['1', '2', '3', '4'] as const;
const RANK_STYLES = [
  'text-gold',
  'text-silver',
  'text-bronze',
  'text-vermilion',
] as const;

/**
 * 선택 날짜의 성적 요약입니다.
 *
 * 기존 MUI Table은 모바일에서 한 행에 숫자가 너무 많이 몰렸기 때문에 제거하고,
 * 플레이어 하나를 카드 한 장으로 보여줍니다. 점수/게임 수/1위 수/평균 순위는
 * 기존 statsByPlayerAtom에서 계산하므로 백엔드 API와 점수 규칙은 바뀌지 않습니다.
 */
export function StatsSummarySection() {
  const statsByPlayer = useAtomValue(statsByPlayerAtom);
  const selectedDate = useAtomValue(selectedDateAtom);
  const selectedPlayerIds = useAtomValue(selectedPlayerIdsAtom);
  const playerMap = useAtomValue(playerMapAtom);
  const selectedPlayerNames = selectedPlayerIds
    .map((playerId) => playerMap[playerId]?.name)
    .filter((name): name is string => Boolean(name));

  const sorted = statsByPlayer
    .filter((stat) => stat.games > 0)
    .slice()
    .sort(
      (a, b) =>
        a.scoreSum - b.scoreSum || (a.avgRank ?? 99) - (b.avgRank ?? 99),
    );

  return (
    <div className="mx-auto w-full max-w-[680px]">
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-muted">
              {selectedDate}
            </p>
            <h1 className="mt-1 text-[19px] font-bold tracking-tight">
              오늘의 점수
            </h1>
            {selectedPlayerNames.length > 0 && (
              <p className="mt-1 max-w-[260px] truncate text-[11px] font-medium text-jade">
                {selectedPlayerNames.join(' · ')} 기준
              </p>
            )}
          </div>
          <span className="text-[11px] font-medium text-muted">
            1위 0 · 2위 1 · 3위 3 · 4위 6
          </span>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-card border border-dashed border-border px-5 py-12 text-center">
            <p className="text-[14px] font-bold">이 날짜엔 기록이 없습니다.</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              기록 탭에서 라운드를 저장하면 일별 성적과 그래프가 자동으로
              만들어집니다.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((stat, index) => {
              const isLeader = index === 0;
              const scoreTone =
                stat.scoreSum === 0
                  ? 'text-jade'
                  : stat.scoreSum <= 3
                    ? 'text-gold'
                    : 'text-vermilion';

              return (
                <article
                  key={stat.player.id}
                  className={`flex items-center gap-3 rounded-card border px-3.5 py-3 shadow-[var(--shadow-1)] ${
                    isLeader
                      ? 'border-jade bg-jade-soft text-[var(--jade-strong)]'
                      : 'border-border bg-surface text-text'
                  }`}
                >
                  <div
                    className={`w-7 shrink-0 text-center text-[22px] font-bold ${
                      RANK_STYLES[Math.min(index, 3)]
                    }`}
                    aria-label={`${index + 1}위`}
                  >
                    {RANK_MARKS[Math.min(index, 3)]}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold">
                      {stat.player.name}
                    </div>
                    <div
                      className={`mt-0.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] ${
                        isLeader ? 'text-[var(--jade-strong)]/75' : 'text-muted'
                      }`}
                    >
                      <span>{stat.games}게임</span>
                      <span>1위 {stat.firstCount}</span>
                      <span>평균 {stat.avgRank?.toFixed(2) ?? '-'}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div
                      className={`text-[27px] font-bold leading-none tabular-nums ${
                        isLeader ? 'text-[var(--jade-strong)]' : scoreTone
                      }`}
                    >
                      {stat.scoreSum}
                    </div>
                    <div
                      className={`mt-1 text-[10px] font-semibold ${
                        isLeader ? 'text-[var(--jade-strong)]/75' : 'text-muted'
                      }`}
                    >
                      누적 벌점
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {sorted.length > 0 && <DailyScoreChart />}
    </div>
  );
}
