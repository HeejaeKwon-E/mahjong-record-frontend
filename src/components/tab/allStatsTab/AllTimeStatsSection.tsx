import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

import type { AllPlayerTotalStats } from '../../../common/types';

// 전체 표만 확인하는 사용자는 차트 라이브러리를 받을 필요가 없습니다.
// 개인 이름을 눌렀을 때만 Dialog와 Recharts 청크를 내려받습니다.
const PlayerStatsDialog = lazy(() =>
  import('./PlayerStatsDialog').then((module) => ({
    default: module.PlayerStatsDialog,
  })),
);

type SortKey =
  | 'name'
  | 'games'
  | 'avg_rank'
  | 'first_rate'
  | 'top2_rate'
  | 'fourth_rate'
  | 'first'
  | 'second'
  | 'third'
  | 'fourth';

type SortDir = 'asc' | 'desc';

const RATE_SORT_KEYS = new Set<SortKey>([
  'avg_rank',
  'first_rate',
  'top2_rate',
  'fourth_rate',
]);

const TABLE_COLUMNS: Array<{
  key: SortKey;
  label: string;
  format?: (row: AllPlayerTotalStats) => string;
}> = [
  { key: 'name', label: '플레이어', format: (row) => row.name },
  {
    key: 'avg_rank',
    label: '평균순위',
    format: (row) => (row.games > 0 ? row.avg_rank.toFixed(2) : '-'),
  },
  {
    key: 'first_rate',
    label: '1위율',
    format: (row) =>
      row.games > 0 ? `${(row.first_rate * 100).toFixed(1)}%` : '-',
  },
  {
    key: 'top2_rate',
    label: '연대율',
    format: (row) =>
      row.games > 0 ? `${(row.top2_rate * 100).toFixed(1)}%` : '-',
  },
  {
    key: 'fourth_rate',
    label: '4위율',
    format: (row) =>
      row.games > 0 ? `${(row.fourth_rate * 100).toFixed(1)}%` : '-',
  },
  { key: 'first', label: '1위' },
  { key: 'second', label: '2위' },
  { key: 'third', label: '3위' },
  { key: 'fourth', label: '4위' },
  { key: 'games', label: '게임' },
];

function getSortValue(row: AllPlayerTotalStats, key: SortKey): number | string {
  if (key === 'name') return row.name;
  return row[key];
}

function formatPeriod(startDate: string, endDate: string) {
  if (!startDate && !endDate) return '전체 기간';
  if (startDate && endDate) return `${startDate} ~ ${endDate}`;
  if (startDate) return `${startDate} 이후`;
  return `${endDate} 이전`;
}

/**
 * 기간별 전체 플레이어 통계를 표로 표시합니다.
 *
 * 전체 통계의 핵심은 플레이어 간 정확한 수치 비교이므로 별도의 랭킹 그래프나
 * 요약 카드를 거치지 않고 표를 기본 노출합니다. 이름을 누르면 같은 기간 조건의
 * 개인 통계 상세 화면으로 이동합니다.
 */
export function AllTimeStatsSection() {
  const [rows, setRows] = useState<AllPlayerTotalStats[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('avg_rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const dateError =
    startDate && endDate && startDate > endDate
      ? '시작일은 종료일보다 늦을 수 없습니다.'
      : '';

  useEffect(() => {
    if (dateError) return;

    const controller = new AbortController();

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setLoadError('');

        const params = new URLSearchParams();
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);

        const query = params.toString();
        const response = await fetch(
          query ? `/api/stats/all?${query}` : '/api/stats/all',
          { signal: controller.signal },
        );

        if (!response.ok) throw new Error('failed to fetch all stats');

        const data: unknown = await response.json();
        setRows(Array.isArray(data) ? (data as AllPlayerTotalStats[]) : []);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        console.error('failed to load all stats', error);
        setRows([]);
        setLoadError('전체 통계를 불러오지 못했습니다.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void fetchStats();
    return () => controller.abort();
  }, [dateError, endDate, startDate]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((leftRow, rightRow) => {
      // 경기하지 않은 플레이어의 비율/평균은 0이 아니라 미정입니다.
      // 평균순위 오름차순에서 0게임 플레이어가 1위로 보이지 않게 항상 뒤로 보냅니다.
      if (RATE_SORT_KEYS.has(sortKey)) {
        if (leftRow.games === 0 && rightRow.games > 0) return 1;
        if (leftRow.games > 0 && rightRow.games === 0) return -1;
      }

      const left = getSortValue(leftRow, sortKey);
      const right = getSortValue(rightRow, sortKey);

      if (typeof left === 'string' && typeof right === 'string') {
        const result = left.localeCompare(right, 'ko-KR');
        return sortDir === 'asc' ? result : -result;
      }

      const result = Number(left) - Number(right);
      return sortDir === 'asc' ? result : -result;
    });
  }, [rows, sortDir, sortKey]);

  const selectedPlayer = useMemo(
    () => rows.find((row) => row.player_id === selectedPlayerId) ?? null,
    [rows, selectedPlayerId],
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDir(
      key === 'name' || key === 'avg_rank' || key === 'fourth_rate'
        ? 'asc'
        : 'desc',
    );
  };

  const handleResetDates = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <section className="space-y-6">
      <header>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">전체 통계</h1>
          </div>
          <span className="rounded-lg bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted">
            {formatPeriod(startDate, endDate)}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          열 제목을 눌러 정렬하고, 플레이어 이름을 누르면 개인 통계를 확인할 수
          있습니다.
        </p>
      </header>

      <div className="rounded-card border border-border bg-surface p-4 shadow-[var(--shadow-1)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">기간</h2>
            <p className="mt-0.5 text-xs text-muted">
              빈 날짜는 기간 제한 없음으로 처리합니다.
            </p>
          </div>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={handleResetDates}
              className="rounded-lg px-2.5 py-2 text-xs font-semibold text-muted transition hover:bg-surface-2 hover:text-text"
            >
              초기화
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <label className="min-w-0">
            <span className="mb-1.5 block text-[11px] font-semibold text-muted">
              시작일
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-11 w-full min-w-0 rounded-xl border border-border bg-bg px-3 text-sm font-semibold tabular-nums outline-none transition focus:border-jade focus:ring-2 focus:ring-jade/15"
            />
          </label>
          <label className="min-w-0">
            <span className="mb-1.5 block text-[11px] font-semibold text-muted">
              종료일
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-11 w-full min-w-0 rounded-xl border border-border bg-bg px-3 text-sm font-semibold tabular-nums outline-none transition focus:border-jade focus:ring-2 focus:ring-jade/15"
            />
          </label>
        </div>

        {dateError && (
          <p className="mt-2 text-xs font-semibold text-vermilion">
            {dateError}
          </p>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">전체 플레이어</h2>
            <p className="mt-1 text-xs text-muted">
              모바일에서는 가로로 밀어 모든 항목을 볼 수 있습니다.
            </p>
          </div>
          {!isLoading && !loadError && (
            <span className="font-mono text-[11px] font-semibold text-muted">
              {rows.length}명
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="rounded-card border border-border bg-surface px-4 py-12 text-center text-sm text-muted">
            통계를 불러오는 중입니다.
          </div>
        ) : loadError ? (
          <div className="rounded-card border border-vermilion/30 bg-vermilion/5 px-4 py-10 text-center text-sm font-semibold text-vermilion">
            {loadError}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-card border border-dashed border-border px-4 py-12 text-center">
            <p className="text-sm font-bold">표시할 통계가 없습니다.</p>
            <p className="mt-1 text-xs text-muted">
              선택한 기간에 기록된 라운드가 있는지 확인해주세요.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-[var(--shadow-1)]">
            <div className="no-sb overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-2/70 text-muted">
                    {TABLE_COLUMNS.map((column) => {
                      const active = sortKey === column.key;
                      return (
                        <th
                          key={column.key}
                          aria-sort={
                            active
                              ? sortDir === 'asc'
                                ? 'ascending'
                                : 'descending'
                              : 'none'
                          }
                          className={`whitespace-nowrap px-3 py-3 font-bold ${
                            column.key === 'name'
                              ? 'sticky left-0 z-10 bg-surface-2 text-left'
                              : 'text-center'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSort(column.key)}
                            className={`inline-flex items-center gap-1 ${active ? 'text-text' : ''}`}
                          >
                            {column.label}
                            {active && (
                              <span aria-hidden="true">
                                {sortDir === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row) => (
                    <tr
                      key={row.player_id}
                      className="group border-b border-border/60 transition last:border-0 hover:bg-surface-2/45"
                    >
                      {TABLE_COLUMNS.map((column) => {
                        const value = column.format
                          ? column.format(row)
                          : String(row[column.key]);
                        return (
                          <td
                            key={column.key}
                            className={`whitespace-nowrap px-3 py-3 font-mono tabular-nums ${
                              column.key === 'name'
                                ? 'sticky left-0 z-10 bg-surface font-sans font-bold group-hover:bg-surface-2'
                                : 'text-center text-muted'
                            }`}
                          >
                            {column.key === 'name' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedPlayerId(row.player_id)
                                }
                                className="font-bold text-text underline-offset-4 hover:text-jade hover:underline"
                              >
                                {value}
                              </button>
                            ) : (
                              value
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedPlayer && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4">
              <div
                role="status"
                className="rounded-card border border-border bg-surface px-6 py-5 text-sm font-semibold text-text shadow-2xl"
              >
                개인 통계를 불러오는 중입니다.
              </div>
            </div>
          }
        >
          <PlayerStatsDialog
            player={selectedPlayer}
            startDate={startDate}
            endDate={endDate}
            onClose={() => setSelectedPlayerId(null)}
          />
        </Suspense>
      )}
    </section>
  );
}
