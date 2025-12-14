// src/mahjong/components/tab/nanikiru/TodayNanikiruSection.tsx
import React, { useMemo, useState } from 'react';
import { Box, Chip, Divider, Typography, Button, Stack } from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import { useAtom } from 'jotai';

import { Section } from '../../common/Section';
import {
  todayNanikiruProblemAtom,
  nanikiruTilesAtom,
} from '../../../state/nanikiruAtoms';

/** hand / tsumo 문자열을 타일 코드 배열로 파싱하는 헬퍼
 *
 * 예:
 *   "34567m2388p5779s" + "1p"
 *   → ["3m","4m","5m","6m","7m","2p","3p","8p","8p","5s","7s","7s","9s","1p"]
 *   "678889m40579p동동" 처럼 한자/한글도 섞여 있음.
 */
function parseHandToCodes(hand: string, tsumo: string): string[] {
  const parseOne = (s: string): string[] => {
    const result: string[] = [];
    let digits = '';

    for (const ch of s) {
      if (/[0-9]/.test(ch)) {
        // 숫자 누적 (나중에 m/p/s와 붙음)
        digits += ch;
      } else if (/[mps]/.test(ch)) {
        // 지금까지 모인 숫자들 각각에 이 슈트를 붙여 코드 생성
        for (const d of digits) {
          result.push(`${d}${ch}`);
        }
        digits = '';
      } else {
        // 숫자/슈트가 아닌 경우: 한자/한글 지패로 간주 → 그대로 코드
        if (digits) {
          // 혹시라도 남은 숫자는 버린다 (이 케이스는 사실상 안 나와야 정상)
          digits = '';
        }
        result.push(ch);
      }
    }
    return result;
  };

  return [...parseOne(hand), ...parseOne(tsumo)];
}

// 타일 코드 → meaning_ko 로 변환하는 헬퍼 (없으면 코드 그대로)
function codeToLabel(
  code: string,
  tiles: ReturnType<typeof nanikiruTilesAtom extends any ? any : never>,
): string {
  // 타입 꼬임 피하려고 any 캐스팅
  const tileList = tiles as any[];
  const found = tileList.find((t) => t.code === code);
  return found?.meaning_ko || code;
}

export const TodayNanikiruSection: React.FC = () => {
  const [problem] = useAtom(todayNanikiruProblemAtom);
  const [tiles] = useAtom(nanikiruTilesAtom);

  // 사용자가 고른 답(라벨 기준, ex: "7삭")
  const MAX_TRIES = 3;

  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  // ✅ 추가
  const [tries, setTries] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (!problem) {
    return (
      <Section title="오늘의 나니키루" icon={<QuizIcon fontSize="small" />}>
        <Typography variant="body2" color="text.secondary">
          오늘의 문제를 불러오지 못했습니다.
        </Typography>
      </Section>
    );
  }

  // 오늘의 문제 선택지 생성: hand + tsumo 에 실제 존재하는 패만 후보로 사용
  const options = useMemo(() => {
    const codes = parseHandToCodes(problem.hand, problem.tsumo);

    // 코드 → 한국어 라벨로 변환 (타일 테이블에 없는 경우 code 그대로)
    const labels = codes.map((code) => ({
      code,
      label: codeToLabel(code, tiles),
    }));

    // 같은 라벨(예: 5삭이 여러 장) 은 1개만 남기기
    const uniqueMap = new Map<string, string>(); // label → code
    labels.forEach(({ code, label }) => {
      if (!uniqueMap.has(label)) {
        uniqueMap.set(label, code);
      }
    });

    return Array.from(uniqueMap.entries()).map(([label, code]) => ({
      label,
      code,
    }));
  }, [problem.hand, problem.tsumo, tiles]);

  //const isCorrect =
  // selectedLabel != null && problem.answers.includes(selectedLabel);

  const shouldReveal = revealed || tries >= MAX_TRIES;

  const handleCheckAnswer = () => {
    if (!selectedLabel) return;

    setChecked(true);

    const correct = problem.answers.includes(selectedLabel);
    if (correct) {
      setRevealed(true); // ✅ 정답이면 즉시 공개
      return;
    }

    // ❌ 오답: 시도 +1
    setTries((prev) => {
      const next = prev + 1;
      if (next >= MAX_TRIES) {
        setRevealed(true); // ✅ 3번째 오답이면 공개
      }
      return next;
    });
  };

  return (
    <Section title="오늘의 나니키루" icon={<QuizIcon fontSize="small" />}>
      {/* 문제 ID / 국 정보 */}
      <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
        문제 #{problem.id}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {problem.round_text}
      </Typography>

      {/* 도라 표시 */}
      <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          도라 표시:
        </Typography>
        {problem.dora_indicator.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            없음
          </Typography>
        ) : (
          problem.dora_indicator.map((code) => {
            const label = codeToLabel(code, tiles);
            return (
              <Chip
                key={code}
                label={label}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            );
          })
        )}
      </Box>

      {/* 패 / 쯔모 (문자열 그대로) */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
          현재 패:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'monospace',
            bgcolor: 'background.paper',
            p: 1,
            borderRadius: 1,
          }}
        >
          {problem.hand} + [{problem.tsumo}]
        </Typography>
      </Box>

      {/* 선택지: 버릴 패 고르기 */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
          어떤 패를 버리시겠습니까?
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {options.map((opt) => {
            const selected = selectedLabel === opt.label;
            return (
              <Chip
                key={opt.code + opt.label}
                label={opt.label}
                clickable
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                onClick={() => {
                  setSelectedLabel(opt.label);
                  setChecked(false); // 새로 선택하면 다시 채점 전 상태로
                }}
                sx={{
                  fontSize: '0.85rem',
                  px: 1.3,
                  py: 0.4,
                  borderRadius: 2,
                }}
              />
            );
          })}
        </Stack>
      </Box>

      {/* 정답 확인 버튼 + 결과 문구 */}
      <Box
        sx={{
          mb: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant="contained"
          size="small"
          disabled={!selectedLabel || revealed || tries >= MAX_TRIES} // ✅ 3번 틀리면 공개되니 더 시도할 필요 없음
          onClick={handleCheckAnswer}
          sx={{ fontSize: '0.85rem', px: 2, py: 0.6, borderRadius: 2 }}
        >
          정답 확인
        </Button>

        {checked && !shouldReveal && (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: 'error.main' }}
          >
            아쉽지만 오답입니다. ({tries}/{MAX_TRIES})
          </Typography>
        )}

        {checked && shouldReveal && revealed && (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: 'success.main' }}
          >
            정답입니다! 🎉
          </Typography>
        )}

        {checked &&
          shouldReveal &&
          !problem.answers.includes(selectedLabel ?? '') && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              3번 틀려서 해설을 공개합니다.
            </Typography>
          )}
      </Box>

      <Divider sx={{ my: 1.5 }} />

      {/* 정답 / 해설 / 효율 정보: 정답 확인 후에만 보여줌 */}
      {shouldReveal && (
        <Box sx={{ mt: 2 }}>
          {/* 모범 답안 */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 0.8,
                display: 'flex',
                alignItems: 'center',
                gap: 0.6,
              }}
            >
              📌 모범 답안
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {problem.answers.map((ans) => (
                <Chip
                  key={ans}
                  label={ans}
                  size="small"
                  color="success"
                  sx={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    px: 1.2,
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* 해설 */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 0.8,
                display: 'flex',
                alignItems: 'center',
                gap: 0.6,
              }}
            >
              📘 해설
            </Typography>

            <Box sx={{ pl: 1 }}>
              {problem.explanations.map((line, idx) => (
                <Typography
                  key={idx}
                  variant="body2"
                  sx={{
                    mb: 0.6,
                    fontSize: '0.9rem',
                    lineHeight: 1.45,
                  }}
                >
                  • {line}
                </Typography>
              ))}
            </Box>
          </Box>

          {/* 효율 정보 */}
          <Box sx={{ mb: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 0.8,
                display: 'flex',
                alignItems: 'center',
                gap: 0.6,
              }}
            >
              📊 효율 정보
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mb: 1,
                whiteSpace: 'pre-line',
              }}
            >
              {problem.effective.raw}
            </Typography>
          </Box>
        </Box>
      )}
    </Section>
  );
};
