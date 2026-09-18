import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type {
  AllPlayerTotalStats,
  PlayerStatsHistory,
} from '../../../common/types';

type PlayerStatsDialogProps = {
  player: AllPlayerTotalStats;
  startDate: string;
  endDate: string;
  onClose: () => void;
};

type RecentRankPoint = {
  game: number;
  rank: number;
  axisDate: string;
  dateLabel: string;
  roundId: number;
};

type RecentGameCount = 10 | 20 | 50;

const RECENT_GAME_OPTIONS: RecentGameCount[] = [10, 20, 50];

const RANK_META = [
  { rank: 1, label: '1위', countKey: 'first', colorClass: 'bg-gold' },
  { rank: 2, label: '2위', countKey: 'second', colorClass: 'bg-silver' },
  { rank: 3, label: '3위', countKey: 'third', colorClass: 'bg-bronze' },
  { rank: 4, label: '4위', countKey: 'fourth', colorClass: 'bg-vermilion' },
] as const;

function formatPeriod(startDate: string, endDate: string) {
  if (!startDate && !endDate) return '전체 기간';
  if (startDate && endDate) return `${startDate} ~ ${endDate}`;
  if (startDate) return `${startDate} 이후`;
  return `${endDate} 이전`;
}

function formatRecentRoundDate(date: string, createdAt: string) {
  const shortDate = date.replaceAll('-', '.');
  const time = createdAt.match(/[T ](\d{2}:\d{2})/)?.[1];
  return time ? `${shortDate} ${time}` : shortDate;
}

/**
 * 전체 통계에서 선택한 플레이어의 상세 통계 화면입니다.
 *
 * 데이터 흐름:
 * 기간 필터 + player_id → 개인 history API → KPI / 최근 성적 그래프 / 순위 분포
 *
 * 전체 통계 API와 동일한 기간 필터를 전달하므로 바깥 랭킹과 상세 화면의 값이
 * 서로 다른 기간을 바라보는 문제를 방지합니다.
 */
export function PlayerStatsDialog({
  player,
  startDate,
  endDate,
  onClose,
}: PlayerStatsDialogProps) {
  const [history, setHistory] = useState<PlayerStatsHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [recentGameCount, setRecentGameCount] = useState<RecentGameCount>(20);

  useEffect(() => {
    const controller = new AbortController();

    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        setHistory(null);

        const params = new URLSearchParams();
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);

        const query = params.toString();
        const url = `/api/stats/players/${player.player_id}/history${query ? `?${query}` : ''}`;
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(
            typeof body?.error === 'string'
              ? body.error
              : 'failed to fetch player history',
          );
        }

        const data = (await response.json()) as PlayerStatsHistory;
        setHistory(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        console.error('failed to load player history', error);
        setLoadError(
          '개인 통계를 불러오지 못했습니다. 백엔드 API 상태를 확인해주세요.',
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void fetchHistory();
    return () => controller.abort();
  }, [endDate, player.player_id, startDate]);

  // Dialog가 열린 동안 배경 스크롤을 막고 Escape 키로 닫을 수 있게 합니다.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const recentRankPoints = useMemo<RecentRankPoint[]>(() => {
    if (!history) return [];

    // API는 최신순으로 반환합니다. 그래프는 왼쪽→오른쪽 시간 흐름이 자연스러우므로
    // 복사 후 뒤집고, 원본 응답 배열은 변경하지 않습니다.
    // API 응답은 최신순이므로 먼저 사용자가 고른 개수만 자른 뒤 뒤집습니다.
    // 이렇게 해야 10게임을 선택했을 때 가장 오래된 10게임이 아니라 최신 10게임이 보입니다.
    return history.recent_rounds
      .slice(0, recentGameCount)
      .reverse()
      .map((round, index) => ({
        game: index + 1,
        rank: round.rank,
        axisDate: round.date.slice(2).replaceAll('-', '.'),
        dateLabel: formatRecentRoundDate(round.date, round.created_at),
        roundId: round.round_id,
      }));
  }, [history, recentGameCount]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 px-3 pt-12 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-stat-title"
        className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] border border-border bg-surface p-5 shadow-2xl sm:rounded-[28px] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted">플레이어 통계</p>
            <h2
              id="player-stat-title"
              className="mt-1 text-2xl font-bold tracking-tight"
            >
              {player.name}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {formatPeriod(startDate, endDate)}
              {history ? ` · ${history.summary.games}게임` : ''}
            </p>
          </div>
          <button
            type="button"
            aria-label="플레이어 통계 닫기"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-xl text-muted transition hover:text-text"
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-card border border-border bg-surface px-4 py-16 text-center text-sm text-muted">
            개인 통계를 불러오는 중입니다.
          </div>
        ) : loadError ? (
          <div className="mt-6 rounded-card border border-vermilion/30 bg-vermilion/5 px-4 py-12 text-center">
            <p className="text-sm font-bold text-vermilion">{loadError}</p>
            <p className="mt-2 text-xs text-muted">
              GET /api/stats/players/{player.player_id}/history 요청을
              확인해주세요.
            </p>
          </div>
        ) : history ? (
          <div className="mt-5 space-y-5">
            {/* 1위율과 4위율은 아래 순위 분포에서 동일한 값을 제공하므로 중복 노출하지 않습니다. */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                [
                  '평균순위',
                  history.summary.games > 0
                    ? history.summary.avg_rank.toFixed(2)
                    : '-',
                ],
                ['연대율', `${(history.summary.top2_rate * 100).toFixed(1)}%`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-card border border-border bg-surface p-3.5 shadow-[var(--shadow-1)]"
                >
                  <div className="text-[11px] font-semibold text-muted">
                    {label}
                  </div>
                  <div className="mt-1 text-2xl font-bold tabular-nums">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <section className="rounded-card border border-border bg-surface p-4 shadow-[var(--shadow-1)]">
              <div className="mb-3">
                <div>
                  <h3 className="text-sm font-semibold">최근 성적</h3>
                  <p className="mt-1 text-[11px] text-muted">
                    날짜 순서대로 최근 게임의 등수 변화를 보여줍니다.
                  </p>
                </div>
                {/* 세 옵션이 화면 너비를 동일하게 나눠 가져 모바일에서도 균형을 유지합니다. */}
                <div
                  role="group"
                  aria-label="최근 성적 표시 게임 수"
                  className="mt-3 grid w-full grid-cols-3 rounded-full bg-surface-2 p-1"
                >
                  {RECENT_GAME_OPTIONS.map((count) => {
                    const active = recentGameCount === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setRecentGameCount(count)}
                        className={`min-h-8 w-full rounded-full px-2.5 text-[11px] font-semibold transition ${
                          active
                            ? 'bg-jade text-on-jade shadow-sm'
                            : 'text-muted hover:text-text'
                        }`}
                      >
                        {count}게임
                      </button>
                    );
                  })}
                </div>
              </div>

              {recentRankPoints.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted">
                  최근 성적이 없습니다.
                </div>
              ) : (
                <div className="h-[230px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {/* 음수 left margin을 제거하고 Y축 순위 라벨 전용 여백을 확보합니다. */}
                    <LineChart
                      data={recentRankPoints}
                      margin={{ top: 10, right: 8, bottom: 4, left: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--border)"
                        strokeDasharray="3 4"
                      />
                      <XAxis
                        dataKey="game"
                        tick={{ fill: 'var(--muted)', fontSize: 10 }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--border)' }}
                        allowDecimals={false}
                        minTickGap={24}
                        tickFormatter={(value) =>
                          recentRankPoints[Number(value) - 1]?.axisDate ?? ''
                        }
                      />
                      <YAxis
                        domain={[1, 4]}
                        reversed
                        ticks={[1, 2, 3, 4]}
                        tick={{ fill: 'var(--muted)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={2}
                        width={36}
                        tickFormatter={(value) => `${value}위`}
                      />
                      <Tooltip
                        cursor={{ stroke: 'var(--border)' }}
                        contentStyle={{
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          background: 'var(--surface)',
                          color: 'var(--text)',
                          boxShadow: '0 10px 30px rgb(0 0 0 / 0.18)',
                          fontSize: 12,
                        }}
                        labelFormatter={(_, payload) => {
                          const point = payload?.[0]?.payload as
                            RecentRankPoint | undefined;
                          return point
                            ? `${point.dateLabel} · 라운드 #${point.roundId}`
                            : '';
                        }}
                        formatter={(value) => [`${Number(value)}위`, '등수']}
                      />
                      <Line
                        type="linear"
                        dataKey="rank"
                        stroke="var(--jade)"
                        strokeWidth={3}
                        dot={{ r: 3.5, fill: 'var(--surface)', strokeWidth: 2 }}
                        activeDot={{ r: 5 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="rounded-card border border-border bg-surface p-4 shadow-[var(--shadow-1)]">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">순위 분포</h3>
                <span className="text-[11px] text-muted">
                  총 {history.summary.games}게임
                </span>
              </div>
              <div className="space-y-3">
                {RANK_META.map((item) => {
                  const count = history.rank_counts[item.countKey];
                  const percentage =
                    history.summary.games > 0
                      ? (count / history.summary.games) * 100
                      : 0;

                  return (
                    <div key={item.rank}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-bold">{item.label}</span>
                        <span className="font-mono text-muted">
                          {count} · {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className={`h-full rounded-full ${item.colorClass}`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
