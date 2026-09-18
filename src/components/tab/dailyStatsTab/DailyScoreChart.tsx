import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  playerMapAtom,
  roundsAtom,
  selectedDateAtom,
  selectedPlayerIdsAtom,
} from '../../../state/mahjongAtoms';

/**
 * 플레이어 선 색은 성적의 좋고 나쁨을 뜻하지 않습니다.
 * 같은 날짜 안에서 플레이어를 빠르게 구분하기 위한 시리즈 전용 색입니다.
 */
const SERIES_COLORS = [
  '#D9A441',
  '#57ADE6',
  '#EC7A6B',
  '#56C596',
  '#A98BE0',
  '#93A6AE',
];

type ChartRow = {
  round: number;
  [playerKey: string]: number | null;
};

/**
 * 선택 날짜의 각 라운드에서 플레이어가 기록한 실제 등수를 보여줍니다.
 *
 * 데이터 흐름:
 * roundsAtom(서버 응답)
 *   → selectedDate 필터
 *   → 기록 탭의 세션 멤버 필터(선택자가 없으면 전체)
 *   → ranking 배열의 index를 1~4위로 변환
 *   → Recharts
 *
 * 참가하지 않은 라운드는 null로 두어 다른 사람의 등수처럼 오해하지 않게 합니다.
 */
export function DailyScoreChart() {
  const rounds = useAtomValue(roundsAtom);
  const selectedDate = useAtomValue(selectedDateAtom);
  const selectedPlayerIds = useAtomValue(selectedPlayerIdsAtom);
  const playerMap = useAtomValue(playerMapAtom);
  const [focusedPlayerId, setFocusedPlayerId] = useState<number | null>(null);

  const { chartData, players } = useMemo(() => {
    const selectedPlayerIdSet = new Set(selectedPlayerIds);
    const dailyRounds = rounds
      .filter((round) => round.date === selectedDate)
      .slice()
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

    // 멤버를 골랐다면 그중 한 명이라도 참가한 라운드만 그래프 축에 포함합니다.
    // 아무도 고르지 않았다면 기존과 동일하게 날짜의 모든 라운드를 사용합니다.
    const relevantRounds =
      selectedPlayerIdSet.size === 0
        ? dailyRounds
        : dailyRounds.filter((round) =>
            round.ranking.some((playerId) => selectedPlayerIdSet.has(playerId)),
          );

    const participatingPlayerIds: number[] = [];
    const seen = new Set<number>();

    for (const round of relevantRounds) {
      for (const playerId of round.ranking) {
        if (seen.has(playerId)) continue;
        seen.add(playerId);
        participatingPlayerIds.push(playerId);
      }
    }

    // 선택 멤버가 있으면 기록 탭에서 고른 순서를 유지합니다.
    // 단, 선택 날짜에 실제 기록이 없는 사람은 빈 선을 만들지 않습니다.
    const visiblePlayerIds =
      selectedPlayerIds.length > 0
        ? selectedPlayerIds.filter((playerId) => seen.has(playerId))
        : participatingPlayerIds;

    const rows: ChartRow[] = relevantRounds.map((round, roundIndex) => {
      const row: ChartRow = { round: roundIndex + 1 };

      for (const playerId of visiblePlayerIds) {
        const rankIndex = round.ranking.indexOf(playerId);
        row[`player_${playerId}`] = rankIndex >= 0 ? rankIndex + 1 : null;
      }

      return row;
    });

    return {
      chartData: rows,
      players: visiblePlayerIds.map((playerId, index) => {
        const latestRound = [...relevantRounds]
          .reverse()
          .find((round) => round.ranking.includes(playerId));
        const latestRankIndex = latestRound?.ranking.indexOf(playerId) ?? -1;

        return {
          id: playerId,
          name: playerMap[playerId]?.name ?? `#${playerId}`,
          color: SERIES_COLORS[index % SERIES_COLORS.length],
          latestRank: latestRankIndex >= 0 ? latestRankIndex + 1 : null,
        };
      }),
    };
  }, [playerMap, rounds, selectedDate, selectedPlayerIds]);

  if (players.length === 0) return null;

  return (
    <section className="mt-7">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold">등수 흐름</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            각 라운드의 실제 등수입니다. 위로 갈수록 좋은 성적입니다.
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-medium text-muted">
          1위가 가장 좋음
        </span>
      </div>

      <div className="rounded-card border border-border bg-surface p-3 shadow-[var(--shadow-1)] sm:p-4">
        <div className="h-[230px] w-full sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            {/* 음수 left margin을 제거하고 Y축 순위 라벨 전용 여백을 확보합니다. */}
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 4"
                vertical={false}
              />
              <XAxis
                dataKey="round"
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                minTickGap={12}
                allowDecimals={false}
                label={{
                  value: '라운드',
                  position: 'insideBottomRight',
                  offset: -2,
                  fill: 'var(--muted)',
                  fontSize: 10,
                }}
              />
              <YAxis
                domain={[1, 4]}
                ticks={[1, 2, 3, 4]}
                reversed
                allowDecimals={false}
                tickFormatter={(rank) => `${rank}위`}
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickMargin={2}
                width={36}
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
                labelFormatter={(round) => `${round}라운드`}
                formatter={(value, name) => {
                  const player = players.find(
                    (item) => `player_${item.id}` === name,
                  );
                  return [`${Number(value)}위`, player?.name ?? String(name)];
                }}
              />

              {players.map((player) => {
                const isDimmed =
                  focusedPlayerId !== null && focusedPlayerId !== player.id;

                return (
                  <Line
                    key={player.id}
                    type="linear"
                    dataKey={`player_${player.id}`}
                    name={`player_${player.id}`}
                    stroke={player.color}
                    strokeWidth={focusedPlayerId === player.id ? 3 : 2}
                    strokeOpacity={isDimmed ? 0.16 : 1}
                    dot={{ r: focusedPlayerId === player.id ? 3.5 : 2.5 }}
                    activeDot={{ r: 4.5 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex flex-wrap gap-2 border-t border-border pt-3">
          {players.map((player) => {
            const active =
              focusedPlayerId === null || focusedPlayerId === player.id;
            return (
              <button
                key={player.id}
                type="button"
                onClick={() =>
                  setFocusedPlayerId((previous) =>
                    previous === player.id ? null : player.id,
                  )
                }
                className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border bg-surface-2 px-2.5 text-[12px] font-semibold transition active:scale-[0.98]"
                style={{ opacity: active ? 1 : 0.35 }}
                aria-pressed={focusedPlayerId === player.id}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: player.color }}
                  aria-hidden="true"
                />
                <span>{player.name}</span>
                <span className="font-mono text-muted">
                  {player.latestRank ? `${player.latestRank}위` : '-'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
