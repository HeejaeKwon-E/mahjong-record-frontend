// src/mahjong/MahjongPage.tsx
import React, { useState, useCallback } from "react";
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
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import BarChartIcon from "@mui/icons-material/BarChart";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

import { useAtom } from "jotai";

// jotai atoms
import {
  selectedDateAtom,
  datePlayersAtom,
  selectedPlayerIdsAtom,
  currentRankingAtom,
  roundsAtom,
  playerMapAtom,
} from "../state/mahjongAtoms";

// 섹션/탭 컴포넌트들
import { PlayerSection } from "../components/RecordTab/PlayerSection";
import { RoundOrderSection } from "../components/RecordTab/RoundOrderSection";
import { StatsSummarySection } from "../components/StatsTab/StatsSummarySection";
import { RoundHistorySection } from "../components/StatsTab/RoundHistorySection";

type SnackbarSeverity = "success" | "error" | "info" | "warning";

type SnackbarState = {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
};

interface MahjongPageProps {
  mode: "light" | "dark";
  toggleColorMode: () => void;
}

const MahjongPage: React.FC<MahjongPageProps> = ({
  mode,
  toggleColorMode,
}) => {
  // ▼ jotai 상태
  const [selectedDate, setSelectedDate] = useAtom(selectedDateAtom);
  const [datePlayers] = useAtom(datePlayersAtom);
  const [, setSelectedPlayerIds] = useAtom(selectedPlayerIdsAtom);
  const [currentRanking] = useAtom(currentRankingAtom);
  const [, setCurrentRanking] = useAtom(currentRankingAtom);
  const [, setRounds] = useAtom(roundsAtom);
  const [playerMap] = useAtom(playerMapAtom);

  // ▼ 로컬 UI 상태
  const [tab, setTab] = useState<number>(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  // 🔹 공통 스낵바 helper
  const showSnackbar = useCallback(
    (message: string, severity: SnackbarSeverity) => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  const handleSnackbarClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // 🔹 날짜 변경 시: 그 날짜의 파티 멤버 기준으로 selected/순위 셋업
  const handleDateChange = (value: string) => {
    const newDate = value || new Date().toISOString().slice(0, 10);
    setSelectedDate(newDate);

    const pool = datePlayers[newDate] ?? [];
    const nextSelected = pool.slice(0, 4);

    setSelectedPlayerIds(nextSelected);
    setCurrentRanking(nextSelected);
  };

  // 🔹 라운드 저장 전 확인 다이얼로그 열기
  const handleOpenConfirm = () => {
    if (currentRanking.length !== 4) {
      showSnackbar(
        "마작은 4인 고정입니다. 참가자를 정확히 4명 선택해주세요.",
        "error"
      );
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    setIsConfirmOpen(false);
  };

  // 🔹 실제로 라운드 저장
  const handleConfirmSave = () => {
    if (currentRanking.length !== 4) {
      setIsConfirmOpen(false);
      showSnackbar("참가자가 4명이 아닙니다. 다시 확인해주세요.", "error");
      return;
    }

    const now = new Date();

    setRounds((prev) => [
      {
        id: Date.now(),
        date: selectedDate,
        ranking: currentRanking,
        createdAt: now.toISOString(),
      },
      ...prev,
    ]);

    setIsConfirmOpen(false);
    showSnackbar("라운드가 저장되었습니다!", "success");
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
        width: "100vw",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* 상단 AppBar */}
      <AppBar position="fixed">
        <Toolbar
          sx={{
            width: "100%",
            boxSizing: "border-box",
            px: 2,
            py: 1,
          }}
        >
          <Typography
            sx={{ flexGrow: 1 }}
            variant="h5"
            noWrap
            fontSize="1.35rem"
          >
            Mahjong Record
          </Typography>

          <TextField
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            sx={{
              bgcolor: "background.paper",
              borderRadius: 2,
              width: 150,
              mr: 1.2,
              "& .MuiInputBase-input": {
                fontSize: "0.9rem",
                py: 0.9,
              },
            }}
          />

          <IconButton color="inherit" onClick={toggleColorMode} sx={{ p: 1 }}>
            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* AppBar 만큼 여백 */}
      <Toolbar />

      {/* 메인 컨텐츠 */}
      <Box
        component="main"
        sx={{
          width: "100%",
          boxSizing: "border-box",
          px: 2.2,
          pt: 2.2,
          pb: 11,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 2.5,
        }}
      >
        {tab === 0 && renderRecordTab()}
        {tab === 1 && renderStatsTab()}
      </Box>

      {/* 하단 탭 */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <BottomNavigation
          value={tab}
          onChange={(_, v) => setTab(v)}
          showLabels
          sx={{ height: 64 }}
        >
          <BottomNavigationAction
            label="기록"
            icon={<EditNoteIcon />}
            sx={{
              "& .MuiBottomNavigationAction-label": { fontSize: "0.8rem" },
            }}
          />
          <BottomNavigationAction
            label="통계"
            icon={<BarChartIcon />}
            sx={{
              "& .MuiBottomNavigationAction-label": { fontSize: "0.8rem" },
            }}
          />
        </BottomNavigation>
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
                  {idx + 1}위: {p?.name ?? "?"}
                </li>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
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
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MahjongPage;
