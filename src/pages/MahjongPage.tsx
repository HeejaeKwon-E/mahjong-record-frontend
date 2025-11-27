// src/mahjong/MahjongPage.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Slide,
  Drawer,
  ListItemButton,
  List,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import BarChartIcon from '@mui/icons-material/BarChart';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MenuIcon from '@mui/icons-material/Menu'; // 🔹 기존 ViewSidebarIcon 대신

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
import type { TransitionProps } from '@mui/material/transitions';

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

/** 스크롤 방향 감지용 커스텀 훅 */
function useScrollDirection() {
  const [direction, setDirection] = useState<'up' | 'down'>('up');

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      if (Math.abs(currentY - lastY) < 4) return; // 작은 움직임 무시
      if (currentY > lastY) {
        setDirection('down');
      } else {
        setDirection('up');
      }
      lastY = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return direction;
}

/** Slide 트랜지션용 래퍼 */
const SlideDown = React.forwardRef(function SlideDown(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="down" ref={ref} {...props} />;
});

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollDirection = useScrollDirection();
  const isAtTop = typeof window !== 'undefined' ? window.scrollY < 10 : true;
  const showAppBar = scrollDirection === 'up' || isAtTop;
  const todayStr = new Date().toISOString().slice(0, 10);
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
    // 새 날짜에 맞는 데이터 재로딩
    reloadDateData();
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
    if (selectedDate !== todayStr) {
      setIsConfirmOpen(false);
      showSnackbar('라운드는 오늘 날짜에만 저장할 수 있어요.', 'warning');
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
  // MahjongPage 컴포넌트 내부에 추가
  const switchTab = (nextTab: number) => {
    setTab(nextTab);

    // 통계 탭(1)으로 들어갈 때는 데이터 새로고침
    if (nextTab === 1) {
      reloadDateData();
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
      {/* 상단 AppBar: 스크롤에 따라 숨김/표시 */}
      <SlideDown in={showAppBar}>
        <AppBar position="fixed">
          <Toolbar
            sx={{
              width: '100%',
              boxSizing: 'border-box',
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {/* 🔹 왼쪽: 날짜 */}
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
              }}
            >
              <TextField
                type="date"
                size="small"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                sx={{
                  maxWidth: 170, // 너무 커지지 않게 제한
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  '& .MuiInputBase-input': {
                    fontSize: '0.85rem',
                    py: 0.7,
                  },
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* 🔹 오른쪽: 메뉴 버튼 (고정) */}
            <IconButton
              color="inherit"
              onClick={() => setSidebarOpen(true)}
              sx={{ flexShrink: 0 }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      </SlideDown>

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
          pb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 2.5,
        }}
      >
        {tab === 0 && renderRecordTab()}
        {tab === 1 && renderStatsTab()}
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
      {/* 오른쪽 사이드바: 메뉴 + (모바일일 때) 날짜/다크모드 */}
      <Drawer
        anchor="right"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      >
        <Box
          sx={{
            width: 240,
            pt: 2,
            pb: 2,
          }}
        >
          {/* 🔹 헤더: "메뉴" + 다크모드 버튼 한 줄 정렬 */}
          <Box
            sx={{
              px: 2,
              pb: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              메뉴
            </Typography>

            <IconButton size="small" onClick={toggleColorMode}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Box>

          <List>
            <ListItemButton
              selected={tab === 0}
              onClick={() => {
                switchTab(0);
                setSidebarOpen(false);
              }}
            >
              <ListItemIcon>
                <EditNoteIcon />
              </ListItemIcon>
              <ListItemText primary="기록" />
            </ListItemButton>

            <ListItemButton
              selected={tab === 1}
              onClick={() => {
                switchTab(1);
                setSidebarOpen(false);
              }}
            >
              <ListItemIcon>
                <BarChartIcon />
              </ListItemIcon>
              <ListItemText primary="통계" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default MahjongPage;
