// src/mahjong/components/StatsTab/AllTimeStatsSection.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { Section } from '../../common/Section';
import type { AllPlayerTotalStats } from '../../../common/types';
import { ScrollableTableContainer } from '../../common/ScrollableTableContainer';

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

export const AllTimeStatsSection: React.FC = () => {
  const [rows, setRows] = useState<AllPlayerTotalStats[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('avg_rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  // ⬇ 기간 필터 (YYYY-MM-DD 문자열, 빈 문자열이면 필터 없음)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');

  // 최초 로드 시 백엔드에서 전체 통계 가져오기
  // 기간이 바뀔 때마다 백엔드에서 전체 통계 가져오기
  useEffect(() => {
    if (!validateDates(startDate, endDate)) {
      setRows([]); // 오류 상태면 테이블 초기화하거나 그대로 둬도 OK
      return;
    }
    const fetchStats = async () => {
      try {
        const params = new URLSearchParams();
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);

        const qs = params.toString();
        const url = qs ? `/api/stats/all?${qs}` : '/api/stats/all';

        const res = await fetch(url);
        if (!res.ok) throw new Error('failed to fetch all stats');
        const data = await res.json();
        if (Array.isArray(data)) {
          setRows(data as AllPlayerTotalStats[]);
        } else {
          setRows([]);
        }
      } catch (e) {
        console.error(e);
        setRows([]);
      }
    };

    fetchStats();
  }, [startDate, endDate]); // ⬅ 기간이 바뀔 때마다 다시 호출

  const sortedRows = useMemo(() => {
    const cloned = [...rows];

    const getValue = (r: AllPlayerTotalStats): number | string => {
      switch (sortKey) {
        case 'games':
          return r.games;
        case 'first':
          return r.first;
        case 'second':
          return r.second;
        case 'third':
          return r.third;
        case 'fourth':
          return r.fourth;
        case 'first_rate':
          return r.first_rate;
        case 'top2_rate':
          return r.top2_rate;
        case 'fourth_rate':
          return r.fourth_rate;
        case 'avg_rank':
          return r.avg_rank;
        case 'name':
        default:
          return r.name;
      }
    };

    cloned.sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);

      if (typeof va === 'string' && typeof vb === 'string') {
        const comp = va.localeCompare(vb, 'ko-KR');
        return sortDir === 'asc' ? comp : -comp;
      }

      const na = Number(va);
      const nb = Number(vb);
      if (na < nb) return sortDir === 'asc' ? -1 : 1;
      if (na > nb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return cloned;
  }, [rows, sortKey, sortDir]);

  const validateDates = (start: string, end: string) => {
    if (!start || !end) {
      setDateError('');
      return true; // 하나라도 비었으면 그냥 통과
    }

    if (start > end) {
      setDateError('시작일은 종료일보다 늦을 수 없습니다.');
      return false;
    }

    setDateError('');
    return true;
  };
  const handleStartChange = (value: string) => {
    setStartDate(value);
    validateDates(value, endDate);
  };

  const handleEndChange = (value: string) => {
    setEndDate(value);
    validateDates(startDate, value);
  };
  const handleResetDates = () => {
    setStartDate('');
    setEndDate('');
    setDateError('');
  };
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc'); // 보통 비율/카운트는 내림차순이 더 자주 쓰이니까 기본을 desc 로
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === 'asc' ? (
      <ArrowUpwardIcon sx={{ fontSize: 14, ml: 0.3 }} />
    ) : (
      <ArrowDownwardIcon sx={{ fontSize: 14, ml: 0.3 }} />
    );
  };

  return (
    <Section title="전체 통계" icon={<LeaderboardIcon fontSize="small" />}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1.2, fontSize: '0.8rem' }}
      >
        열 제목을 눌러 오름차순 / 내림차순 정렬할 수 있어요.
      </Typography>
      {/* 🔹 기간 필터 */}
      <Box
        sx={{
          mb: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          columnGap: 0.5,
          flexWrap: 'nowrap', // ⬅ 절대 줄 바꿈 안 함
        }}
      >
        {/* 왼쪽: 시작일 / 종료일 세로 배치 */}
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0, // ⬅ 여기 덕분에 가로가 줄어들 때 왼쪽이 잘 줄어듦
            display: 'flex',
            flexDirection: 'column',
            rowGap: 1.2, // ⬅ 간격 살짝 늘림 (기존 0.6 → 1)
          }}
        >
          <TextField
            label="시작일"
            type="date"
            size="small"
            value={startDate}
            onChange={(e) => handleStartChange(e.target.value)}
            error={!!dateError}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: '0.75rem',
                py: 0.5,
              },
            }}
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />

          <TextField
            label="종료일"
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => handleEndChange(e.target.value)}
            error={!!dateError}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: '0.75rem',
                py: 0.5,
              },
            }}
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />
        </Box>

        {/* 오른쪽: 리셋 버튼 */}
        <Button
          variant="contained" // ⬅ 색 채워진 버튼
          color="primary"
          size="small"
          onClick={handleResetDates}
          sx={{
            ml: 1,
            alignSelf: 'center',
            fontSize: '0.75rem',
            px: 1.4,
            py: 0.5,
            whiteSpace: 'nowrap',
            minWidth: 'auto',
            borderRadius: 999, // pill 느낌 (원하면 빼도 됨)
            boxShadow: 1, // ⬅ 살짝 음영
          }}
        >
          기간 초기화
        </Button>
      </Box>

      {sortedRows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          아직 기록된 라운드가 없거나 통계를 불러오지 못했습니다.
        </Typography>
      ) : (
        <ScrollableTableContainer>
          <Table
            size="small"
            sx={{
              tableLayout: 'auto',
              '& td, & th': {
                px: 0.7,
                py: 0.9,
                whiteSpace: 'nowrap',
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  align="center"
                  onClick={() => handleSort('name')}
                  sx={{ cursor: 'pointer', fontWeight: 700 }}
                >
                  플레이어
                  {renderSortIcon('name')}
                </TableCell>
                <TableCell
                  align="center"
                  onClick={() => handleSort('avg_rank')}
                  sx={{ cursor: 'pointer', fontWeight: 700 }}
                >
                  평균순위
                  {renderSortIcon('avg_rank')}
                </TableCell>
                <TableCell
                  align="center"
                  onClick={() => handleSort('first_rate')}
                  sx={{ cursor: 'pointer', fontWeight: 700 }}
                >
                  1위율
                  {renderSortIcon('first_rate')}
                </TableCell>

                <TableCell
                  align="center"
                  onClick={() => handleSort('top2_rate')}
                  sx={{ cursor: 'pointer', fontWeight: 700 }}
                >
                  연대율
                  {renderSortIcon('top2_rate')}
                </TableCell>

                <TableCell
                  align="center"
                  onClick={() => handleSort('fourth_rate')}
                  sx={{ cursor: 'pointer', fontWeight: 700 }}
                >
                  4위율
                  {renderSortIcon('fourth_rate')}
                </TableCell>

                <TableCell
                  align="center"
                  onClick={() => handleSort('first')}
                  sx={{ cursor: 'pointer', fontWeight: 700 }}
                >
                  1위
                  {renderSortIcon('first')}
                </TableCell>
                <TableCell
                  align="center"
                  onClick={() => handleSort('second')}
                  sx={{ cursor: 'pointer', fontWeight: 700 }}
                >
                  2위
                  {renderSortIcon('second')}
                </TableCell>
                <TableCell
                  align="center"
                  onClick={() => handleSort('third')}
                  sx={{ cursor: 'pointer', fontWeight: 700 }}
                >
                  3위
                  {renderSortIcon('third')}
                </TableCell>
                <TableCell
                  align="center"
                  onClick={() => handleSort('fourth')}
                  sx={{ cursor: 'pointer', fontWeight: 700 }}
                >
                  4위
                  {renderSortIcon('fourth')}
                </TableCell>
                <TableCell
                  align="center"
                  onClick={() => handleSort('games')}
                  sx={{ cursor: 'pointer', fontWeight: 700 }}
                >
                  국수
                  {renderSortIcon('games')}
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {sortedRows.map((row) => (
                <TableRow key={row.player_id} hover>
                  <TableCell align="center">{row.name}</TableCell>
                  <TableCell align="center">
                    {row.games > 0 ? row.avg_rank.toFixed(2) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {(row.first_rate * 100 || 0).toFixed(1)}%
                  </TableCell>
                  <TableCell align="center">
                    {(row.top2_rate * 100 || 0).toFixed(1)}%
                  </TableCell>
                  <TableCell align="center">
                    {(row.fourth_rate * 100 || 0).toFixed(1)}%
                  </TableCell>
                  <TableCell align="center">{row.first}</TableCell>
                  <TableCell align="center">{row.second}</TableCell>
                  <TableCell align="center">{row.third}</TableCell>
                  <TableCell align="center">{row.fourth}</TableCell>
                  <TableCell align="center">{row.games}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollableTableContainer>
      )}
    </Section>
  );
};
