import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';

import { MahjongTile } from '../../mahjong/MahjongTile';
import { selectedDateAtom } from '../../../state/mahjongAtoms';
import {
  type NanikiruProblem,
  type NanikiruTile,
  nanikiruTilesAtom,
  todayNanikiruProblemAtom,
} from '../../../state/nanikiruAtoms';

const MAX_TRIES = 3;

type RevealReason = 'correct' | 'maxTries' | null;

type NanikiruProblemViewProps = {
  problem: NanikiruProblem;
  tiles: NanikiruTile[];
};

/** "34567m2388p" 형식의 압축 문자열을 개별 패 코드로 변환합니다. */
function parseTileCodes(source: string): string[] {
  const result: string[] = [];
  let digits = '';

  for (const character of source) {
    if (/[0-9]/.test(character)) {
      digits += character;
      continue;
    }

    if (/[mps]/.test(character)) {
      for (const digit of digits) result.push(`${digit}${character}`);
      digits = '';
      continue;
    }

    // 숫자패가 아닌 문자는 동/남/서/북/백/발/중 같은 자패 코드입니다.
    digits = '';
    result.push(character);
  }

  return result;
}

/** 데이터셋에 누락된 코드가 있어도 화면 전체가 깨지지 않게 최소 메타데이터를 만듭니다. */
function createFallbackTile(code: string): NanikiruTile {
  const match = /^([0-9])([mps])$/.exec(code);
  if (!match) {
    return {
      code,
      label: code,
      color: 'k',
      meaning_ko: code,
      type: 'honor',
    };
  }

  const suitByCode = { m: 'man', p: 'pin', s: 'sou' } as const;
  const suitName = { m: '만', p: '통', s: '삭' } as const;
  const rawRank = Number(match[1]);
  const rank = rawRank === 0 ? 5 : rawRank;
  const suitCode = match[2] as keyof typeof suitByCode;

  return {
    code,
    label: String(rank),
    color: rawRank === 0 ? 'a' : 'k',
    meaning_ko: `${rank}${suitName[suitCode]}`,
    type: 'number',
    suit: suitByCode[suitCode],
    rank: rawRank,
    aka: rawRank === 0,
  };
}

function NanikiruProblemView({ problem, tiles }: NanikiruProblemViewProps) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [lastCheckedLabel, setLastCheckedLabel] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [revealReason, setRevealReason] = useState<RevealReason>(null);

  const tileMap = useMemo(
    () => new Map(tiles.map((tile) => [tile.code, tile])),
    [tiles],
  );
  const handCodes = useMemo(() => parseTileCodes(problem.hand), [problem.hand]);
  const drawnCode = useMemo(
    () => parseTileCodes(problem.tsumo)[0] ?? problem.tsumo,
    [problem.tsumo],
  );

  const shouldReveal = revealReason !== null;
  const remainingTries = Math.max(0, MAX_TRIES - tries);

  const getTile = (code: string) =>
    tileMap.get(code) ?? createFallbackTile(code);

  const handleSelect = (tile: NanikiruTile) => {
    if (shouldReveal) return;
    setSelectedLabel((previous) =>
      previous === tile.meaning_ko ? null : tile.meaning_ko,
    );
  };

  const handleCheckAnswer = () => {
    if (!selectedLabel || shouldReveal) return;

    setLastCheckedLabel(selectedLabel);
    if (problem.answers.includes(selectedLabel)) {
      setRevealReason('correct');
      return;
    }

    const nextTries = tries + 1;
    setTries(nextTries);
    if (nextTries >= MAX_TRIES) {
      setRevealReason('maxTries');
      return;
    }

    // 같은 패를 실수로 연속 제출하지 않도록 오답 후 선택만 비웁니다.
    setSelectedLabel(null);
  };

  return (
    <section className="mx-auto max-w-[560px] space-y-5">
      <header>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted">오늘의 문제</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">
              오늘의 나니키루
            </h1>
          </div>
          <span className="rounded-lg bg-surface-2 px-2.5 py-1 font-mono text-[11px] font-semibold text-muted">
            #{problem.id}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">{problem.round_text}</p>
      </header>

      <div className="flex items-center gap-3">
        <span className="w-16 shrink-0 text-xs font-semibold text-muted">
          도라 표시
        </span>
        {problem.dora_indicator.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {problem.dora_indicator.map((code, index) => (
              <MahjongTile
                key={`${code}-${index}`}
                tile={getTile(code)}
                small
                ariaLabel={`도라 표시패 ${getTile(code).meaning_ko}`}
              />
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted">없음</span>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">손패</h2>
            <p className="mt-0.5 text-[11px] text-muted">
              버릴 패를 직접 탭하세요.
            </p>
          </div>
          <span className="font-mono text-[11px] font-semibold text-muted">
            {shouldReveal ? '해설 공개됨' : `남은 시도 ${remainingTries}`}
          </span>
        </div>

        <div className="rounded-card border border-border bg-surface px-3 pb-3 pt-5 shadow-[var(--shadow-1)]">
          <div className="no-sb overflow-x-auto px-1 pb-2 pt-3">
            <div className="flex min-w-max items-end gap-1">
              {handCodes.map((code, index) => {
                const tile = getTile(code);
                return (
                  <MahjongTile
                    key={`${code}-${index}`}
                    tile={tile}
                    selected={selectedLabel === tile.meaning_ko}
                    disabled={shouldReveal}
                    ariaLabel={`${tile.meaning_ko} 버리기`}
                    onSelect={() => handleSelect(tile)}
                  />
                );
              })}

              <div className="ml-2 border-l border-dashed border-border pl-3">
                <MahjongTile
                  tile={getTile(drawnCode)}
                  selected={selectedLabel === getTile(drawnCode).meaning_ko}
                  drawn
                  disabled={shouldReveal}
                  ariaLabel={`쯔모패 ${getTile(drawnCode).meaning_ko} 버리기`}
                  onSelect={() => handleSelect(getTile(drawnCode))}
                />
              </div>
            </div>
          </div>

          <div className="mt-2 flex min-h-5 items-center justify-between gap-3 border-t border-border pt-3 text-xs">
            <span className="text-muted">선택한 패</span>
            <span className="font-bold text-jade">
              {selectedLabel ?? '아직 선택하지 않음'}
            </span>
          </div>
        </div>
      </div>

      {problem.calls.length > 0 && (
        <div className="rounded-xl border border-border bg-surface-2 px-3.5 py-3">
          <div className="text-[11px] font-semibold text-muted">후로</div>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {problem.calls.map((call, index) => (
              <span
                key={`${call}-${index}`}
                className="rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold"
              >
                {call}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!selectedLabel || shouldReveal}
        onClick={handleCheckAnswer}
        className="h-12 w-full rounded-full bg-jade text-[15px] font-semibold text-on-jade shadow-[var(--shadow-1)] transition hover:bg-jade-strong active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35"
      >
        {shouldReveal ? '해설이 공개되었습니다' : '정답 확인'}
      </button>

      {!shouldReveal && tries > 0 && (
        <div className="rounded-xl border border-vermilion/30 bg-vermilion/5 px-3.5 py-3">
          <div className="text-sm font-bold text-vermilion">오답입니다</div>
          <div className="mt-0.5 text-xs text-muted">
            {lastCheckedLabel} 선택 · {tries}/{MAX_TRIES}회 · 다른 패를
            골라보세요.
          </div>
        </div>
      )}

      {revealReason === 'correct' && (
        <div className="rounded-xl border border-jade/30 bg-jade/10 px-3.5 py-3">
          <div className="text-sm font-bold text-jade">정답입니다</div>
          <div className="mt-0.5 text-xs text-muted">
            {lastCheckedLabel}을 버리는 선택이 맞습니다.
          </div>
        </div>
      )}

      {revealReason === 'maxTries' && (
        <div className="rounded-xl border border-border bg-surface-2 px-3.5 py-3">
          <div className="text-sm font-bold">
            세 번의 시도를 모두 사용했습니다
          </div>
          <div className="mt-0.5 text-xs text-muted">
            아래에서 모범 답안과 해설을 확인하세요.
          </div>
        </div>
      )}

      {shouldReveal && (
        <div className="space-y-5 border-t border-border pt-5">
          <section>
            <h2 className="text-xs font-semibold text-muted">모범 답안</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {problem.answers.map((answer) => (
                <span
                  key={answer}
                  className="rounded-full bg-jade px-3 py-1.5 text-sm font-semibold text-on-jade"
                >
                  {answer}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-muted">해설</h2>
            <div className="mt-2 space-y-2 rounded-card border border-border bg-surface p-4">
              {problem.explanations.map((explanation, index) => (
                <div
                  key={`${explanation}-${index}`}
                  className="flex gap-2.5 text-sm leading-relaxed"
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-jade-soft text-[10px] font-black text-jade">
                    {index + 1}
                  </span>
                  <p>{explanation}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-xs font-semibold text-muted">수읽기</h2>
              <span className="rounded-lg bg-surface-2 px-2 py-1 text-[10px] font-bold text-muted">
                {problem.effective.shanten}샨텐
              </span>
            </div>
            <div className="mt-2 rounded-card border border-border bg-surface-2 p-4">
              <p className="font-mono text-xs leading-relaxed">
                {problem.effective.raw}
              </p>
              {problem.effective.tiles &&
                problem.effective.tiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    {problem.effective.tiles.map((tile) => (
                      <span
                        key={tile.label}
                        className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs"
                      >
                        <strong>{tile.label}</strong>
                        <span className="ml-1.5 font-mono text-muted">
                          {tile.count}장
                        </span>
                      </span>
                    ))}
                  </div>
                )}
            </div>
          </section>

          {revealReason === 'maxTries' && lastCheckedLabel && (
            <p className="text-xs text-muted">
              마지막 선택: {lastCheckedLabel}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * 선택 날짜에 대응하는 문제를 주입하는 얇은 컨테이너입니다.
 * key에 날짜와 문제 ID를 함께 사용해 날짜 이동 시 선택/시도/공개 상태가
 * 이전 문제에서 다음 문제로 누적되지 않게 합니다.
 */
export function TodayNanikiruSection() {
  const selectedDate = useAtomValue(selectedDateAtom);
  const problem = useAtomValue(todayNanikiruProblemAtom);
  const tiles = useAtomValue(nanikiruTilesAtom);

  if (!problem) {
    return (
      <section className="mx-auto max-w-[560px] rounded-card border border-dashed border-border px-4 py-16 text-center">
        <h1 className="text-base font-bold">
          오늘의 문제를 불러오지 못했습니다.
        </h1>
        <p className="mt-2 text-xs text-muted">
          날짜 정보와 나니키루 데이터셋을 확인해주세요.
        </p>
      </section>
    );
  }

  return (
    <NanikiruProblemView
      key={`${selectedDate}-${problem.id}`}
      problem={problem}
      tiles={tiles}
    />
  );
}
