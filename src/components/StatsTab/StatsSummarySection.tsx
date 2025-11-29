// src/mahjong/components/StatsTab/StatsSummarySection.tsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import { useAtom } from 'jotai';

import { statsByPlayerAtom, selectedDateAtom } from '../../state/mahjongAtoms';
import { Section } from '../Section';

export const StatsSummarySection: React.FC = () => {
  const [statsByPlayer] = useAtom(statsByPlayerAtom);
  const [selectedDate] = useAtom(selectedDateAtom);

  // 🔹 플레이 기록 있는 사람만, 점수 합계 오름차순 정렬
  const played = statsByPlayer.filter((s) => s.games > 0);
  const sorted = [...played].sort((a, b) => a.scoreSum - b.scoreSum);

  return (
    <Section
      title={`${selectedDate} 통계`}
      icon={<InsightsIcon fontSize="small" />}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1.5, fontSize: '0.8rem' }}
      >
        1위 0점 · 2위 1점 · 3위 3점 · 4위 6점
      </Typography>

      {sorted.length === 0 ? (
        <Typography color="text.secondary">플레이 기록이 없습니다.</Typography>
      ) : (
        <>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              bgcolor: 'background.paper',
              maxWidth: '100%',
              overflowX: 'scroll',
            }}
          >
            <Table
              size="small"
              sx={{
                tableLayout: 'auto', // 🔹 열 기준 레이아웃
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    플레이어
                  </TableCell>

                  {/* 🔥 점수 칼럼을 두 번째로 이동 */}
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    점수
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    게임
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    1위
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    평균
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {sorted.map((stat) => (
                  <TableRow
                    key={stat.player.id}
                    hover
                    sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    {/* 플레이어 */}
                    <TableCell
                      component="th"
                      scope="row"
                      align="center"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {stat.player.name}
                    </TableCell>

                    {/* 🔥 점수 — 강조 색상도 유지 */}
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                        color:
                          stat.scoreSum === 0
                            ? 'success.main'
                            : stat.scoreSum <= 3
                              ? 'warning.main'
                              : 'error.main',
                      }}
                    >
                      {stat.scoreSum}
                    </TableCell>

                    {/* 게임 */}
                    <TableCell align="center">{stat.games}</TableCell>

                    {/* 1위 */}
                    <TableCell align="center">{stat.firstCount}</TableCell>

                    {/* 평균 */}
                    <TableCell align="center">
                      {stat.avgRank?.toFixed(2) ?? '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Section>
  );
};
