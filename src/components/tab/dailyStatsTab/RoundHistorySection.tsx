// src/mahjong/components/StatsTab/RoundHistorySection.tsx
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useAtom } from 'jotai';

import {
  roundsAtom,
  selectedDateAtom,
  playerMapAtom,
  serverTodayAtom,
} from '../../../state/mahjongAtoms';
import { Section } from '../../common/Section';
import type { Round } from '../../../common/types';
import { useServerSync } from '../../../hooks/useServerSync';
import { ScrollableTableContainer } from '../../common/ScrollableTableContainer';

type RoundHistorySectionProps = {
  showSnackbar: (
    msg: string,
    severity: 'success' | 'error' | 'info' | 'warning',
  ) => void;
};

export const RoundHistorySection: React.FC<RoundHistorySectionProps> = ({
  showSnackbar,
}) => {
  const { reloadDateData } = useServerSync();
  const [rounds] = useAtom(roundsAtom);
  const [selectedDate] = useAtom(selectedDateAtom);
  const [playerMap] = useAtom(playerMapAtom);
  const [serverToday] = useAtom(serverTodayAtom);
  const [deleteTarget, setDeleteTarget] = useState<Round | null>(null);

  const filtered = rounds.filter((r) => r.date === selectedDate);
  const isToday = selectedDate === serverToday;

  const formatTime = (round: Round) => {
    const ts = round.created_at;
    if (!ts) return '-';
    return new Date(ts).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleRequestDelete = (round: Round) => {
    setDeleteTarget(round);
  };

  const handleCloseDialog = () => {
    setDeleteTarget(null);
  };

  // 🔥 실제 삭제 처리 (지금은 프론트 상태만 수정)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/rounds/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '라운드 삭제 실패');
      }

      await reloadDateData(); // ← 서버 상태 기준으로 다시 동기화
      setDeleteTarget(null);
      showSnackbar('라운드가 삭제되었습니다.', 'success');
    } catch (e) {
      console.error(e);
      setDeleteTarget(null);
      showSnackbar('라운드 삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  return (
    <Section
      title={`라운드 기록`}
      collapsible
      defaultExpanded
      icon={<HistoryIcon fontSize="small" />}
    >
      {filtered.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          이 날짜에는 기록된 라운드가 없습니다.
        </Typography>
      ) : (
        <>
          <ScrollableTableContainer>
            <Table
              size="small"
              sx={{
                tableLayout: 'auto',
                '& td, & th': {
                  px: 0.8, // 기본 16px → 6px 정도로 감소
                  py: 0.9, // 기본 6px → 약간 넉넉하게
                  whiteSpace: 'nowrap',
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    시간
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
                    2위
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    3위
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    4위
                  </TableCell>
                  {/* 🔹 삭제 컬럼 */}
                  {isToday && (
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        //width: 56,
                      }}
                    >
                      {/*삭제*/}
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {filtered.map((round) => {
                  const ranking = round.ranking ?? [];
                  const names = ranking.map(
                    (pid: number) => playerMap[pid]?.name ?? '?',
                  );

                  return (
                    <TableRow key={round.id} hover>
                      <TableCell
                        align="center"
                        sx={{
                          whiteSpace: 'nowrap',
                          fontSize: '0.9rem',
                        }}
                      >
                        {formatTime(round)}
                      </TableCell>

                      {Array.from({ length: 4 }).map((_, i) => (
                        <TableCell
                          key={i}
                          align="center"
                          sx={{
                            whiteSpace: 'nowrap',
                            fontSize: '0.9rem',
                          }}
                        >
                          {names[i] ?? '-'}
                        </TableCell>
                      ))}

                      {/* 🔹 삭제 버튼 */}
                      {isToday && (
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleRequestDelete(round)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollableTableContainer>

          {/* 🔹 삭제 확인 다이얼로그 */}
          <Dialog open={!!deleteTarget} onClose={handleCloseDialog} fullWidth>
            <DialogTitle>이 라운드를 삭제할까요?</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 1 }}>
                {deleteTarget
                  ? `${formatTime(deleteTarget)} 라운드 기록을 삭제합니다.`
                  : ''}
              </DialogContentText>
              {deleteTarget && (
                <DialogContentText
                  sx={{ fontSize: '0.9rem', mt: 1 }}
                  color="text.secondary"
                >
                  {deleteTarget.ranking
                    .map((pid, idx) => {
                      const name = playerMap[pid]?.name ?? '?';
                      return `${idx + 1}위: ${name}`;
                    })
                    .join(' · ')}
                </DialogContentText>
              )}
              <DialogContentText sx={{ mt: 1.5 }} color="text.secondary">
                삭제 후에는 되돌릴 수 없습니다.
              </DialogContentText>
            </DialogContent>
            <DialogActions
              sx={{
                justifyContent: 'space-between',
                px: 3,
                pb: 2,
                gap: 2,
              }}
            >
              <Button onClick={handleCloseDialog}>취소</Button>
              <Button
                onClick={handleConfirmDelete}
                variant="contained"
                color="error"
              >
                삭제
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Section>
  );
};
