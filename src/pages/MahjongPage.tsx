// src/mahjong/MahjongPage.tsx
import React, { useState, useCallback } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  TextField,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  //ToolbarProps,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import BarChartIcon from '@mui/icons-material/BarChart';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import { useAtom } from 'jotai';

// jotai atoms
import {
  selectedDateAtom,
  selectedPlayerIdsAtom,
  currentRankingAtom,
  playerMapAtom,
} from '../state/mahjongAtoms';

// 섹션/탭 컴포넌트들
import { PlayerSection } from '../components/RecordTab/PlayerSection';
import { RoundOrderSection } from '../components/RecordTab/RoundOrderSection';
import { StatsSummarySection } from '../components/StatsTab/StatsSummarySection';
import { RoundHistorySection } from '../components/StatsTab/RoundHistorySection';
import { useServerSync } from '../hooks/useServerSync';

type SnackbarSeverity = 'success' | 'error' | 'info' | 'warning';

type SnackbarState = {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
};

interface MahjongPageProps {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
}

const MahjongPage: React.FC<MahjongPageProps> = ({ mode, toggleColorMode }) => {
  const { reloadDateData } = useServerSync();
  // ▼ jotai 상태
  const [playerMap] = useAtom(playerMapAtom);
  const [currentRanking] = useAtom(currentRankingAtom);
  const [selectedDate, setSelectedDate] = useAtom(selectedDateAtom);
  const [, setCurrentRanking] = useAtom(currentRankingAtom);
  const [, setSelectedPlayerIds] = useAtom(selectedPlayerIdsAtom);

  // ▼ 로컬 UI 상태
  const [tab, setTab] = useState<number>(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  // 🔹 공통 스낵바 helper
  const showSnackbar = useCallback(
    (message: string, severity: SnackbarSeverity) => {
      setSnackbar({ open: true, message, severity });
    },
    [],
  );

  const handleSnackbarClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // 🔹 날짜 변경 시: 그 날짜의 파티 멤버 기준으로 selected/순위 셋업
  const handleDateChange = (value: string) => {
    const newDate =
      value && value.trim().length > 0
        ? value
        : new Date().toISOString().slice(0, 10);

    // 1) 날짜만 먼저 변경
    setSelectedDate(newDate);

    // 2) 이 시점에는 아직 새 날짜 데이터가 안 들어왔으니
    //    선택/순위는 일단 초기화
    setSelectedPlayerIds([]);
    setCurrentRanking([]);
  };

  // 🔹 라운드 저장 전 확인 다이얼로그 열기
  const handleOpenConfirm = () => {
    // currentRanking 또는 "이번 라운드에 실제로 포함된 플레이어 ID" 기준
    if (currentRanking.length !== 4) {
      showSnackbar('라운드는 정확히 4명이 있어야 저장할 수 있어요.', 'warning');
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    setIsConfirmOpen(false);
  };

  // 🔹 실제로 라운드 저장
  const handleConfirmSave = async () => {
    if (currentRanking.length !== 4) {
      setIsConfirmOpen(false);
      showSnackbar('참가자가 4명이 아닙니다. 다시 확인해주세요.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          ranking: currentRanking, // [playerId1, playerId2, ...]
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '라운드 저장 실패');
      }

      // 여기서 round_id를 써서 로컬에 직접 push하지 않고,
      // 서버에 실제로 들어간 상태를 다시 GET
      await reloadDateData();

      setIsConfirmOpen(false);
      showSnackbar('라운드가 저장되었습니다!', 'success');
    } catch (err) {
      console.error(err);
      setIsConfirmOpen(false);
      showSnackbar('라운드 저장 중 오류가 발생했습니다.', 'error');
    }
  };
  const handleTabChange = async (_: React.SyntheticEvent, value: number) => {
    setTab(value);

    // 통계 탭으로 들어올 때마다 날짜별 데이터 새로고침
    if (value === 1) {
      await reloadDateData();
    }
  };

  // 🔹 Record 탭 렌더
  const renderRecordTab = () => (
    <>
      <PlayerSection showSnackbar={showSnackbar} />
      <RoundOrderSection onOpenConfirm={handleOpenConfirm} />
    </>
  );

  // 🔹 Stats 탭 렌더
  const renderStatsTab = () => (
    <>
      <StatsSummarySection />
      <RoundHistorySection />
    </>
  );

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* AppBar*/}
      <AppBar
        position="fixed"
        elevation={mode === 'dark' ? 0 : 1}
        sx={{
          bgcolor: mode === 'dark' ? 'grey.950' : 'background.paper',
          color: 'text.primary', // ← 여기 때문에 라이트/다크 둘 다 글자 선명
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar
          sx={{
            width: '100%',
            boxSizing: 'border-box',
            px: 2,
            py: 1,
          }}
        >
          <Typography
            sx={{ flexGrow: 1 }}
            variant="h5"
            noWrap
            fontSize="1.35rem"
            fontWeight={700}
            color="inherit" // AppBar의 color를 그대로 따라감
          >
            Mahjong Record
          </Typography>

          <TextField
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            sx={{
              bgcolor:
                mode === 'dark'
                  ? 'rgba(255,255,255,0.06)'
                  : 'background.default',
              borderRadius: 2,
              width: 150,
              mr: 1.2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor:
                  mode === 'dark'
                    ? 'rgba(255,255,255,0.16)'
                    : 'rgba(0,0,0,0.15)',
              },
              '& .MuiInputBase-input': {
                fontSize: '0.9rem',
                py: 0.9,
              },
            }}
          />

          <IconButton
            color="inherit"
            onClick={toggleColorMode}
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor:
                mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            }}
          >
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      {/* AppBar 만큼 여백 */}
      <Toolbar />
      {/* 메인 컨텐츠 */}
      <Box
        component="main"
        sx={{
          width: '100%',
          boxSizing: 'border-box',
          px: 2.2,
          pt: 2.2,
          pb: 11,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 2.5,
        }}
      >
        {tab === 0 && renderRecordTab()}
        {tab === 1 && renderStatsTab()}
      </Box>
      {/* 하단 탭 */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480, // 모바일 기준 중앙에 떠 있는 느낌
          px: 2,
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            borderRadius: 999,
            bgcolor: 'background.paper',
            boxShadow: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <BottomNavigation
            value={tab}
            onChange={handleTabChange}
            showLabels
            sx={{
              height: 60,
              bgcolor: 'transparent',
              '& .MuiBottomNavigationAction-root': {
                minWidth: 0,
                py: 0.5,
              },
              '& .Mui-selected': {
                color: 'primary.main',
              },
              '& .Mui-selected .MuiBottomNavigationAction-label': {
                fontSize: '0.8rem',
                fontWeight: 700,
              },
            }}
          >
            <BottomNavigationAction
              label="기록"
              icon={<EditNoteIcon />}
              sx={{
                '& .MuiBottomNavigationAction-label': { fontSize: '0.78rem' },
              }}
            />
            <BottomNavigationAction
              label="통계"
              icon={<BarChartIcon />}
              sx={{
                '& .MuiBottomNavigationAction-label': { fontSize: '0.78rem' },
              }}
            />
          </BottomNavigation>
        </Box>
      </Box>
      {/* 라운드 저장 전 확인 다이얼로그 */}
      <Dialog open={isConfirmOpen} onClose={handleCloseConfirm} fullWidth>
        <DialogTitle>이 라운드를 저장할까요?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1.5 }}>
            {selectedDate} 라운드의 등수를 다음과 같이 저장합니다:
          </DialogContentText>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {currentRanking.map((pid, idx) => {
              const p = playerMap[pid];
              return (
                <li key={pid}>
                  {idx + 1}위: {p?.name ?? '?'}
                </li>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'space-between',
            px: 3,
            pb: 2,
            gap: 2,
          }}
        >
          <Button onClick={handleCloseConfirm}>취소</Button>
          <Button
            onClick={handleConfirmSave}
            variant="contained"
            color="primary"
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
      {/* 공통 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MahjongPage;
