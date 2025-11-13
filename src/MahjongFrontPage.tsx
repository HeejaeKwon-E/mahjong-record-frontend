// MahjongFrontPage.tsx
import React, { useMemo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Chip,
  Stack,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import EditNoteIcon from '@mui/icons-material/EditNote';
import BarChartIcon from '@mui/icons-material/BarChart';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import GroupIcon from '@mui/icons-material/Group';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import InsightsIcon from '@mui/icons-material/Insights';
import HistoryIcon from '@mui/icons-material/History';

type Player = {
  id: number;
  name: string;
};

type Round = {
  id: number;
  date: string; // YYYY-MM-DD
  ranking: number[]; // 참가 플레이어 id, index 0 = 1위
};

type PlayerStats = {
  player: Player;
  games: number;
  firstCount: number;
  avgRank: number | null;
};

interface PageProps {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
}

type SnackbarSeverity = 'success' | 'error' | 'info' | 'warning';

type SnackbarState = {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
};

const initialPlayers: Player[] = [
  { id: 1, name: '민수' },
  { id: 2, name: '지훈' },
  { id: 3, name: '수진' },
  { id: 4, name: '영희' },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

type SectionProps = {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
};

const Section: React.FC<SectionProps> = ({ title, icon, children }) => {
  return (
    <Box mb={3} sx={{ width: '100%' }}>
      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          borderRadius: 2,
          p: 1.8,
          pt: 1.6,
          pb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 1.6,
          }}
        >
          <Box
            sx={{
              width: 4,
              height: 24,
              borderRadius: 2,
              bgcolor: 'primary.main',
              mr: 1.4,
            }}
          />
          {icon && (
            <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
              {icon}
            </Box>
          )}
          <Typography
            variant="subtitle1"
            sx={{ fontSize: '1.05rem', fontWeight: 600 }}
          >
            {title}
          </Typography>
        </Box>

        {children}
      </Paper>
    </Box>
  );
};

const MahjongFrontPage: React.FC<PageProps> = ({ mode, toggleColorMode }) => {
  const today = todayStr();

  // 🔹 전체 플레이어 (글로벌)
  const [players, setPlayers] = useState<Player[]>(initialPlayers);

  // 🔹 날짜별 파티 멤버: { "2025-11-13": [1,2,3], ... }
  const [datePlayers, setDatePlayers] = useState<Record<string, number[]>>({
    [today]: initialPlayers.map((p) => p.id),
  });

  const [newPlayerName, setNewPlayerName] = useState('');

  const [selectedDate, setSelectedDate] = useState<string>(today);

  // 🔹 이 라운드에 실제로 참여하는 플레이어 (최대 4명)
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>(
    initialPlayers.slice(0, 4).map((p) => p.id),
  );

  // 🔹 등수 순서
  const [currentRanking, setCurrentRanking] = useState<number[]>(
    initialPlayers.slice(0, 4).map((p) => p.id),
  );

  const [rounds, setRounds] = useState<Round[]>([]);
  const [tab, setTab] = useState<number>(0);

  // ✅ 방금 움직인 플레이어 id (하이라이트용)
  const [lastMovedId, setLastMovedId] = useState<number | null>(null);
  // 🔹 같이 자리 바뀐 상대 줄
  const [lastSwappedId, setLastSwappedId] = useState<number | null>(null);

  // 저장 확인 다이얼로그
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // 공통 스낵바
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const playerMap = useMemo(
    () =>
      players.reduce<Record<number, Player>>((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {}),
    [players],
  );

  // 현재 날짜의 파티 멤버 id 리스트
  const currentDatePlayerIds = datePlayers[selectedDate] ?? [];

  // 현재 날짜의 파티 멤버 Player 객체 리스트
  const currentDatePlayers: Player[] = currentDatePlayerIds
    .map((id) => playerMap[id])
    .filter(Boolean);

  // 🔹 스낵바 helper
  const showSnackbar = (message: string, severity: SnackbarSeverity) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleSnackbarClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // 🔹 날짜 변경 시: 그 날짜의 파티 멤버 불러오기 + 기본 4명 선택
  const handleDateChange = (value: string) => {
    const newDate = value || todayStr();
    setSelectedDate(newDate);

    const pool = datePlayers[newDate] ?? [];

    const nextSelected = pool.slice(0, 4);
    setSelectedPlayerIds(nextSelected);
    setCurrentRanking(nextSelected);
  };

  // 🔹 새 플레이어 추가 (글로벌 + 현재 날짜 파티에 추가)
  const handleAddPlayer = () => {
    const trimmed = newPlayerName.trim();

    if (!trimmed) {
      showSnackbar('플레이어 이름을 입력해주세요.', 'error');
      return;
    }

    // 이미 존재하는 플레이어면 그 id 재사용
    let playerId: number;
    const existing = players.find((p) => p.name === trimmed);

    if (existing) {
      playerId = existing.id;
    } else {
      const nextId =
        players.length > 0 ? Math.max(...players.map((p) => p.id)) + 1 : 1;
      const newPlayer: Player = { id: nextId, name: trimmed };
      setPlayers((prev) => [...prev, newPlayer]);
      playerId = nextId;
    }

    // 현재 날짜의 파티 멤버에 추가
    setDatePlayers((prev) => {
      const prevForDate = prev[selectedDate] ?? [];
      if (prevForDate.includes(playerId)) {
        return prev; // 이미 이 날짜 파티에 있음
      }
      return {
        ...prev,
        [selectedDate]: [...prevForDate, playerId],
      };
    });

    // 이 라운드 참가자에도 최대 4명까지 자동 추가
    setSelectedPlayerIds((prevSelected) => {
      if (prevSelected.includes(playerId) || prevSelected.length >= 4) {
        return prevSelected;
      }
      const nextSelected = [...prevSelected, playerId];

      // 순위 배열도 맞춰서 업데이트
      setCurrentRanking((prevRanking) => {
        const filtered = prevRanking.filter((id) => nextSelected.includes(id));
        const added = nextSelected.filter((id) => !filtered.includes(id));
        return [...filtered, ...added];
      });

      return nextSelected;
    });

    setNewPlayerName('');
    showSnackbar('플레이어가 추가/연결되었습니다.', 'success');
  };

  // 🔹 Chip 클릭: 이 라운드 참가자 선택/해제 (날짜 파티는 그대로 두고)
  const handleToggleParticipant = (playerId: number) => {
    setSelectedPlayerIds((prevSelected) => {
      const isSelected = prevSelected.includes(playerId);

      if (isSelected) {
        const nextSelected = prevSelected.filter((id) => id !== playerId);
        setCurrentRanking((prevRanking) =>
          prevRanking.filter((id) => id !== playerId),
        );
        return nextSelected;
      } else {
        if (prevSelected.length >= 4) {
          showSnackbar('한 라운드에는 최대 4명만 참가할 수 있습니다.', 'error');
          return prevSelected;
        }

        const nextSelected = [...prevSelected, playerId];

        setCurrentRanking((prevRanking) => {
          const filtered = prevRanking.filter((id) =>
            nextSelected.includes(id),
          );
          const added = nextSelected.filter((id) => !filtered.includes(id));
          return [...filtered, ...added];
        });

        return nextSelected;
      }
    });
  };

  // 🔹 순위 위/아래 이동
  const moveRank = (index: number, direction: 'up' | 'down') => {
    setCurrentRanking((prev) => {
      const newOrder = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newOrder.length) return prev;

      const primaryId = newOrder[index]; // 내가 클릭한 줄
      const secondaryId = newOrder[targetIndex]; // 같이 자리 바뀐 줄

      [newOrder[index], newOrder[targetIndex]] = [
        newOrder[targetIndex],
        newOrder[index],
      ];

      // 🔹 하이라이트할 두 줄 id 저장
      setLastMovedId(primaryId);
      setLastSwappedId(secondaryId);

      // 0.3초 정도 후에 효과 제거
      setTimeout(() => {
        setLastMovedId((cur) => (cur === primaryId ? null : cur));
        setLastSwappedId((cur) => (cur === secondaryId ? null : cur));
      }, 300);

      return newOrder;
    });
  };

  // 🔹 저장 전에 다이얼로그 띄우기
  const handleOpenConfirm = () => {
    if (currentRanking.length !== 4) {
      showSnackbar(
        '마작은 4인 고정입니다. 참가자를 정확히 4명 선택해주세요.',
        'error',
      );
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    setIsConfirmOpen(false);
  };

  // 🔹 실제 저장 (다이얼로그에서 "저장")
  const handleConfirmSave = () => {
    if (currentRanking.length !== 4) {
      setIsConfirmOpen(false);
      showSnackbar('참가자가 4명이 아닙니다. 다시 확인해주세요.', 'error');
      return;
    }

    const newRound: Round = {
      id: Date.now(),
      date: selectedDate,
      ranking: currentRanking,
    };

    setRounds((prev) => [newRound, ...prev]);
    setIsConfirmOpen(false);

    showSnackbar('라운드가 저장되었습니다!', 'success');
  };

  // 🔹 날짜 기준 통계
  const statsByPlayer: PlayerStats[] = useMemo(() => {
    const statsMap = new Map<
      number,
      { games: number; firstCount: number; sumRank: number }
    >();

    const filtered = rounds.filter((r) => r.date === selectedDate);

    filtered.forEach((round) => {
      round.ranking.forEach((playerId, index) => {
        const rank = index + 1;
        const cur = statsMap.get(playerId) ?? {
          games: 0,
          firstCount: 0,
          sumRank: 0,
        };
        cur.games += 1;
        cur.sumRank += rank;
        if (rank === 1) cur.firstCount += 1;
        statsMap.set(playerId, cur);
      });
    });

    return players.map((p) => {
      const stat = statsMap.get(p.id);
      if (!stat) return { player: p, games: 0, firstCount: 0, avgRank: null };
      return {
        player: p,
        games: stat.games,
        firstCount: stat.firstCount,
        avgRank: stat.sumRank / stat.games,
      };
    });
  }, [players, rounds, selectedDate]);

  // --- 탭 1: 기록 ---
  const renderRecordTab = () => (
    <>
      {/* 플레이어 섹션 */}
      <Section
        title={`플레이어 (참가자 ${selectedPlayerIds.length}/4)`}
        icon={<GroupIcon fontSize="small" />}
      >
        <Stack
          direction="row"
          spacing={1.2}
          useFlexGap
          sx={{
            width: '100%',
            pb: 1.5,
            flexWrap: 'wrap',
          }}
        >
          {currentDatePlayers.map((player) => {
            const selected = selectedPlayerIds.includes(player.id);
            const disabled = !selected && selectedPlayerIds.length >= 4;

            return (
              <Chip
                key={player.id}
                label={player.name}
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                clickable
                onClick={() => handleToggleParticipant(player.id)}
                disabled={disabled}
                sx={{
                  fontSize: '0.95rem',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                }}
              />
            );
          })}
        </Stack>

        <Box
          mt={1.5}
          display="flex"
          gap={1.2}
          sx={{ width: '100%', alignItems: 'center' }}
        >
          <TextField
            fullWidth
            size="medium"
            placeholder="플레이어 이름 추가"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            InputProps={{
              sx: { fontSize: '0.98rem', py: 0.7 },
            }}
          />
          <IconButton color="primary" onClick={handleAddPlayer} sx={{ p: 1.2 }}>
            <AddIcon />
          </IconButton>
        </Box>
      </Section>

      {/* 이번 라운드 등수 섹션 */}
      <Section
        title="이번 라운드 등수"
        icon={<EmojiEventsIcon fontSize="small" />}
      >
        <List sx={{ width: '100%' }}>
          {currentRanking.map((pid, idx) => {
            const player = playerMap[pid];
            if (!player) return null;
            const rank = idx + 1;

            const isPrimaryMoved = pid === lastMovedId;
            const isSecondaryMoved = pid === lastSwappedId;

            return (
              <ListItem
                key={pid}
                sx={{
                  width: '100%',
                  py: 1.1,
                  borderRadius: 1.5,
                  mb: 0.3,
                  // 🔹 주인공: 확실한 반응
                  bgcolor: isPrimaryMoved ? 'action.selected' : 'transparent',
                  transform: isPrimaryMoved ? 'scale(1.03)' : 'scale(1)',
                  boxShadow: isPrimaryMoved ? 3 : 0,

                  // 🔹 스왑된 줄: 배경색 없이 borderColor만 약하게
                  border: isSecondaryMoved
                    ? '2px solid'
                    : '2px solid transparent',
                  borderColor: isSecondaryMoved
                    ? 'action.disabled'
                    : 'transparent',

                  transition:
                    'background-color 0.25s ease, transform 0.15s ease, box-shadow 0.15s ease, border-color 0.25s ease',
                }}
                secondaryAction={
                  <Box>
                    <IconButton
                      disabled={idx === 0}
                      onClick={() => moveRank(idx, 'up')}
                      sx={{ p: 0.7 }}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      disabled={idx === currentRanking.length - 1}
                      onClick={() => moveRank(idx, 'down')}
                      sx={{ p: 0.7 }}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={`${rank}위 – ${player.name}`}
                  primaryTypographyProps={{ fontSize: '1rem' }}
                />
              </ListItem>
            );
          })}

          {currentRanking.length === 0 && (
            <ListItem sx={{ width: '100%', py: 1.4 }}>
              <ListItemText
                primary="참가자를 선택하면 순위를 정할 수 있어요."
                primaryTypographyProps={{ fontSize: '0.95rem' }}
              />
            </ListItem>
          )}
        </List>

        <Box
          mt={1.8}
          display="flex"
          justifyContent="flex-end"
          sx={{ width: '100%' }}
        >
          <Button
            variant="contained"
            size="medium"
            onClick={handleOpenConfirm}
            sx={{ px: 3, py: 1, fontSize: '0.95rem', borderRadius: 2 }}
          >
            이 라운드 저장
          </Button>
        </Box>
      </Section>
    </>
  );

  // --- 탭 2: 통계 ---
  const renderStatsTab = () => (
    <>
      {/* 날짜 통계 섹션 */}
      <Section
        title={`${selectedDate} 통계`}
        icon={<InsightsIcon fontSize="small" />}
      >
        <List sx={{ width: '100%' }}>
          {statsByPlayer.map((stat) => (
            <ListItem key={stat.player.id} sx={{ width: '100%', py: 1.1 }}>
              <ListItemText
                primary={stat.player.name}
                secondary={
                  stat.games === 0
                    ? '플레이 기록 없음'
                    : `플레이 ${stat.games}회 · 1위 ${stat.firstCount}회 · 평균 등수 ${
                        stat.avgRank?.toFixed(2) ?? '-'
                      }`
                }
                primaryTypographyProps={{ fontSize: '1rem' }}
                secondaryTypographyProps={{ fontSize: '0.9rem' }}
              />
            </ListItem>
          ))}
        </List>
      </Section>

      {/* 라운드 기록 섹션 */}
      <Section
        title={`라운드 기록 (${selectedDate})`}
        icon={<HistoryIcon fontSize="small" />}
      >
        {rounds.filter((r) => r.date === selectedDate).length === 0 ? (
          <Box p={0.4}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: '0.95rem' }}
            >
              아직 저장된 라운드가 없습니다.
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%' }}>
            {rounds
              .filter((r) => r.date === selectedDate)
              .map((round) => (
                <React.Fragment key={round.id}>
                  <ListItem sx={{ width: '100%', py: 1 }}>
                    <ListItemText
                      primary={round.ranking
                        .map((pid, idx) => {
                          const p = playerMap[pid];
                          return `${idx + 1}위: ${p?.name ?? '?'}`;
                        })
                        .join(' · ')}
                      primaryTypographyProps={{ fontSize: '0.95rem' }}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
          </List>
        )}
      </Section>
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
      {/* 상단 AppBar */}
      <AppBar position="fixed">
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
          >
            Mahjong Record
          </Typography>

          <TextField
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              width: 150,
              mr: 1.2,
              '& .MuiInputBase-input': {
                fontSize: '0.9rem',
                py: 0.9,
              },
            }}
          />

          <IconButton color="inherit" onClick={toggleColorMode} sx={{ p: 1 }}>
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* AppBar 공간 확보 */}
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
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: 1,
          borderColor: 'divider',
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
              '& .MuiBottomNavigationAction-label': { fontSize: '0.8rem' },
            }}
          />
          <BottomNavigationAction
            label="통계"
            icon={<BarChartIcon />}
            sx={{
              '& .MuiBottomNavigationAction-label': { fontSize: '0.8rem' },
            }}
          />
        </BottomNavigation>
      </Box>

      {/* 저장 전 확인 다이얼로그 */}
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

export default MahjongFrontPage;
