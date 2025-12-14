// src/mahjong/components/tab/nanikiru/TodayNanikiruSection.tsx
import React, { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  Divider,
  Typography,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import { useAtom } from 'jotai';

import { Section } from '../../common/Section';
import {
  todayNanikiruProblemAtom,
  nanikiruTilesAtom,
} from '../../../state/nanikiruAtoms';

/** hand / tsumo 문자열을 타일 코드 배열로 파싱 */
function parseHandToCodes(hand: string, tsumo: string): string[] {
  const parseOne = (s: string): string[] => {
    const result: string[] = [];
    let digits = '';

    for (const ch of s) {
      if (/[0-9]/.test(ch)) {
        digits += ch;
      } else if (/[mps]/.test(ch)) {
        for (const d of digits) result.push(`${d}${ch}`);
        digits = '';
      } else {
        if (digits) digits = '';
        result.push(ch); // 지패(한자/한글) 그대로
      }
    }
    return result;
  };

  return [...parseOne(hand), ...parseOne(tsumo)];
}

// 타일 코드 → meaning_ko 로 변환 (없으면 코드 그대로)
function codeToLabel(code: string, tiles: any[]): string {
  const found = tiles.find((t) => t.code === code);
  return found?.meaning_ko || code;
}

type Option = { code: string; label: string; kind: 'number' | 'honor' };

function isHonorCode(code: string) {
  // 숫자+슈트(m/p/s)가 아니면 지패로 취급
  return !/^[0-9][mps]$/.test(code);
}

function uniqByLabelPreserveOrder(opts: Option[]) {
  const seen = new Set<string>();
  const out: Option[] = [];
  for (const o of opts) {
    if (seen.has(o.label)) continue;
    seen.add(o.label);
    out.push(o);
  }
  return out;
}

export const TodayNanikiruSection: React.FC = () => {
  const [problem] = useAtom(todayNanikiruProblemAtom);
  const [tiles] = useAtom(nanikiruTilesAtom);

  const MAX_TRIES = 3;

  // 사용자가 고른 답(라벨 기준, ex: "7삭")
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  // 시도/공개 상태
  const [tries, setTries] = useState(0); // 오답 횟수
  const [revealReason, setRevealReason] = useState<
    'correct' | 'maxTries' | null
  >(null);
  const shouldReveal = revealReason != null;

  if (!problem) {
    return (
      <Section title="오늘의 나니키루" icon={<QuizIcon fontSize="small" />}>
        <Typography variant="body2" color="text.secondary">
          오늘의 문제를 불러오지 못했습니다.
        </Typography>
      </Section>
    );
  }

  const options = useMemo(() => {
    const codes = parseHandToCodes(problem.hand, problem.tsumo);

    const base: Option[] = codes.map((code) => ({
      code,
      label: codeToLabel(code, tiles as any[]),
      kind: isHonorCode(code) ? 'honor' : 'number',
    }));

    // 같은 라벨은 1개만
    const unique = uniqByLabelPreserveOrder(base);

    // 숫자패/자패 분리
    const numbers = unique.filter((o) => o.kind === 'number');
    const honors = unique.filter((o) => o.kind === 'honor');

    return { numbers, honors };
  }, [problem.hand, problem.tsumo, tiles]);

  const isCorrectNow =
    selectedLabel != null && problem.answers.includes(selectedLabel);

  const handleSelect = (label: string) => {
    setSelectedLabel(label);
    // 선택 바꿔도 tries/reveal은 유지 (퍼즐이니까)
  };

  const handleCheckAnswer = () => {
    if (!selectedLabel || shouldReveal) return;

    if (problem.answers.includes(selectedLabel)) {
      setRevealReason('correct');
      return;
    }

    setTries((prev) => {
      const next = prev + 1;
      if (next >= MAX_TRIES) {
        setRevealReason('maxTries');
      }
      return next;
    });
  };

  const remaining = Math.max(0, MAX_TRIES - tries);

  return (
    <Section title="오늘의 나니키루" icon={<QuizIcon fontSize="small" />}>
      {/* 상단 요약 */}
      <Box sx={{ mb: 1.2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          문제 #{problem.id}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.4 }}>
          {problem.round_text}
        </Typography>
      </Box>

      {/* 도라 표시 */}
      <Box sx={{ mb: 1.2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          도라:
        </Typography>
        {problem.dora_indicator.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            없음
          </Typography>
        ) : (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {problem.dora_indicator.map((code) => (
              <Chip
                key={code}
                label={codeToLabel(code, tiles as any[])}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
          </Stack>
        )}
      </Box>

      {/* 현재 패 */}
      <Box sx={{ mb: 1.4 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.6 }}>
          현재 패
        </Typography>
        <Box
          sx={{
            bgcolor: 'action.hover',
            borderRadius: 2,
            p: 1.1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', lineHeight: 1.5 }}
          >
            {problem.hand}{' '}
            <Box component="span" sx={{ color: 'text.secondary' }}>
              +{' '}
            </Box>
            <Box
              component="span"
              sx={{ fontWeight: 800, color: 'primary.main' }}
            >
              [{problem.tsumo}]
            </Box>
          </Typography>
        </Box>
      </Box>

      {/* 선택지 */}
      <Box sx={{ mb: 1.2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.8 }}>
          어떤 패를 버리시겠습니까?
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: 'text.secondary' }}
          >
            숫자패
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 0.8 }}
          >
            {options.numbers.map((opt) => {
              const selected = selectedLabel === opt.label;
              return (
                <Chip
                  key={opt.code + opt.label}
                  label={opt.label}
                  clickable
                  color={selected ? 'primary' : 'default'}
                  variant={selected ? 'filled' : 'outlined'}
                  onClick={() => handleSelect(opt.label)}
                  sx={{
                    fontSize: '0.86rem',
                    px: 1.25,
                    py: 0.45,
                    borderRadius: 2,
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        {options.honors.length > 0 && (
          <Box sx={{ mt: 1.4 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: 'text.secondary' }}
            >
              자패
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 0.8 }}
            >
              {options.honors.map((opt) => {
                const selected = selectedLabel === opt.label;
                return (
                  <Chip
                    key={opt.code + opt.label}
                    label={opt.label}
                    clickable
                    color={selected ? 'primary' : 'default'}
                    variant={selected ? 'filled' : 'outlined'}
                    onClick={() => handleSelect(opt.label)}
                    sx={{
                      fontSize: '0.86rem',
                      px: 1.25,
                      py: 0.45,
                      borderRadius: 2,
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}
      </Box>

      {/* 버튼 + 결과(고정 배치: 세로) */}
      <Box
        sx={{
          mt: 1.6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 1,
        }}
      >
        <Button
          variant="contained"
          size="medium"
          disabled={!selectedLabel || shouldReveal}
          onClick={handleCheckAnswer}
          sx={{
            borderRadius: 2.2,
            py: 1.05,
            fontWeight: 800,
          }}
        >
          정답 확인
        </Button>

        {/* 결과 영역: 항상 이 자리에 고정 */}
        {!shouldReveal && tries > 0 && (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
            오답입니다. ({tries}/{MAX_TRIES})
          </Alert>
        )}

        {shouldReveal && revealReason === 'correct' && (
          <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>
            정답입니다! 🎉
          </Alert>
        )}

        {shouldReveal && revealReason === 'maxTries' && (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
            {MAX_TRIES}번 틀려서 해설을 공개합니다.
          </Alert>
        )}

        {/* 시도 안내(항상 같은 자리) */}
        {!shouldReveal && (
          <Typography variant="caption" color="text.secondary">
            남은 시도: {remaining}/{MAX_TRIES}
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* 해설 공개 */}
      {shouldReveal && (
        <Box sx={{ mt: 0.5 }}>
          {/* 모범 답안 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.8 }}>
              📌 모범 답안
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {problem.answers.map((ans) => (
                <Chip
                  key={ans}
                  label={ans}
                  size="small"
                  color="success"
                  sx={{ fontSize: '0.86rem', fontWeight: 800, px: 1.2 }}
                />
              ))}
            </Stack>
          </Box>

          {/* 해설 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.8 }}>
              📘 해설
            </Typography>

            <Box
              sx={{
                bgcolor: 'action.hover',
                borderRadius: 2,
                p: 1.2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {problem.explanations.map((line, idx) => (
                <Typography
                  key={idx}
                  variant="body2"
                  sx={{ mb: idx === problem.explanations.length - 1 ? 0 : 0.8 }}
                >
                  • {line}
                </Typography>
              ))}
            </Box>
          </Box>

          {/* 효율 정보 */}
          <Box sx={{ mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.8 }}>
              📊 효율 정보
            </Typography>

            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                p: 1.2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {problem.effective.raw}
              </Typography>
            </Box>
          </Box>

          {/* (선택) 사용자가 정답을 맞췄는지/틀렸는지 다시 요약 */}
          {revealReason === 'maxTries' && selectedLabel && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1 }}
            >
              마지막 선택: {selectedLabel} {isCorrectNow ? '(정답)' : '(오답)'}
            </Typography>
          )}
        </Box>
      )}
    </Section>
  );
};
