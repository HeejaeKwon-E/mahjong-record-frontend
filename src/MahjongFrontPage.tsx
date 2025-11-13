// MahjongFrontPage.tsx
import React, { useMemo, useState } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import EditNoteIcon from "@mui/icons-material/EditNote";
import BarChartIcon from "@mui/icons-material/BarChart";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

type Player = {
  id: number;
  name: string;
};

type Round = {
  id: number;
  date: string; // YYYY-MM-DD
  ranking: number[]; // 4명 id, index 0 = 1위
};

type PlayerStats = {
  player: Player;
  games: number;
  firstCount: number;
  avgRank: number | null;
};

interface PageProps {
  mode: "light" | "dark";
  toggleColorMode: () => void;
}

const initialPlayers: Player[] = [
  { id: 1, name: "민수" },
  { id: 2, name: "지훈" },
  { id: 3, name: "수진" },
  { id: 4, name: "영희" },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

const MahjongFrontPage: React.FC<PageProps> = ({ mode, toggleColorMode }) => {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [newPlayerName, setNewPlayerName] = useState("");

  const [selectedDate, setSelectedDate] = useState<string>(todayStr());

  // 이번 판 참가자 (최대 4명)
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>(
    initialPlayers.slice(0, 4).map((p) => p.id)
  );

  // 참가자들 순위 배열
  const [currentRanking, setCurrentRanking] = useState<number[]>(
    initialPlayers.slice(0, 4).map((p) => p.id)
  );

  const [rounds, setRounds] = useState<Round[]>([]);
  const [tab, setTab] = useState<number>(0);

  const playerMap = useMemo(
    () =>
      players.reduce<Record<number, Player>>((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {}),
    [players]
  );

  // 새 플레이어 추가
  const handleAddPlayer = () => {
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;

    const nextId =
      players.length > 0 ? Math.max(...players.map((p) => p.id)) + 1 : 1;
    const newPlayer: Player = { id: nextId, name: trimmed };

    setPlayers((prev) => [...prev, newPlayer]);

    // 4명 미만이면 자동 참가자로도 추가
    setSelectedPlayerIds((prevSelected) => {
      if (prevSelected.length >= 4) return prevSelected;

      const nextSelected = [...prevSelected, nextId];

      setCurrentRanking((prevRanking) => {
        const filtered = prevRanking.filter((id) =>
          nextSelected.includes(id)
        );
        const added = nextSelected.filter((id) => !filtered.includes(id));
        return [...filtered, ...added];
      });

      return nextSelected;
    });

    setNewPlayerName("");
  };

  // Chip 클릭: 참가자 선택/해제 (최대 4명)
  const handleToggleParticipant = (playerId: number) => {
    setSelectedPlayerIds((prevSelected) => {
      const isSelected = prevSelected.includes(playerId);

      if (isSelected) {
        const nextSelected = prevSelected.filter((id) => id !== playerId);
        setCurrentRanking((prevRanking) =>
          prevRanking.filter((id) => id !== playerId)
        );
        return nextSelected;
      } else {
        if (prevSelected.length >= 4) {
          return prevSelected;
        }

        const nextSelected = [...prevSelected, playerId];

        setCurrentRanking((prevRanking) => {
          const filtered = prevRanking.filter((id) =>
            nextSelected.includes(id)
          );
          const added = nextSelected.filter((id) => !filtered.includes(id));
          return [...filtered, ...added];
        });

        return nextSelected;
      }
    });
  };

  // 순위 위/아래 이동
  const moveRank = (index: number, direction: "up" | "down") => {
    setCurrentRanking((prev) => {
      const newOrder = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newOrder.length) return prev;

      [newOrder[index], newOrder[targetIndex]] = [
        newOrder[targetIndex],
        newOrder[index],
      ];
      return newOrder;
    });
  };

  // 라운드 저장 (4명 아니면 막기)
  const handleSaveRound = () => {
    if (currentRanking.length !== 4) {
      window.alert("마작은 4인 고정입니다. 참가자를 정확히 4명 선택해주세요.");
      return;
    }

    const newRound: Round = {
      id: Date.now(),
      date: selectedDate,
      ranking: currentRanking,
    };

    setRounds((prev) => [newRound, ...prev]);
  };

  // 날짜 기준 통계
  const statsByPlayer: PlayerStats[] = useMemo(() => {
    const statsMap = new Map<
      number,
      { games: number; firstCount: number; sumRank: number }
    >();

    const filtered = rounds.filter((r) => r.date === selectedDate);

    filtered.forEach((round) => {
      round.ranking.forEach((playerId, index) => {
        const rank = index + 1;
        const cur =
          statsMap.get(playerId) ?? { games: 0, firstCount: 0, sumRank: 0 };
        cur.games += 1;
        cur.sumRank += rank;
        if (rank === 1) cur.firstCount += 1;
        statsMap.set(playerId, cur);
      });
    });

    return players.map((p) => {
      const stat = statsMap.get(p.id);
      if (!stat)
        return { player: p, games: 0, firstCount: 0, avgRank: null };
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
      {/* 참가자 선택 */}
      <Box mb={3} sx={{ width: "100%" }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontSize: "1.05rem" }}>
          플레이어 (참가자 {selectedPlayerIds.length}/4)
        </Typography>

        <Stack
          direction="row"
          spacing={1.2}
          sx={{ overflowX: "auto", pb: 1.5, width: "100%" }}
        >
          {players.map((player) => {
            const selected = selectedPlayerIds.includes(player.id);
            const disabled = !selected && selectedPlayerIds.length >= 4;

            return (
              <Chip
                key={player.id}
                label={player.name}
                color={selected ? "primary" : "default"}
                variant={selected ? "filled" : "outlined"}
                clickable
                onClick={() => handleToggleParticipant(player.id)}
                disabled={disabled}
                sx={{
                  fontSize: "0.95rem",
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
          sx={{ width: "100%", alignItems: "center" }}
        >
          <TextField
            fullWidth
            size="medium"
            placeholder="새 플레이어 이름"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            InputProps={{
              sx: { fontSize: "0.98rem", py: 0.7 },
            }}
          />
          <IconButton
            color="primary"
            onClick={handleAddPlayer}
            sx={{ p: 1.2 }}
          >
            <AddIcon />
          </IconButton>
        </Box>
      </Box>

      {/* 이번 라운드 등수 */}
      <Box mb={3} sx={{ width: "100%" }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontSize: "1.05rem" }}>
          이번 라운드 등수
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            width: "100%",
            borderRadius: 2,
          }}
        >
          <List sx={{ width: "100%" }}>
            {currentRanking.map((pid, idx) => {
              const player = playerMap[pid];
              if (!player) return null;
              const rank = idx + 1;
              return (
                <ListItem
                  key={pid}
                  sx={{
                    width: "100%",
                    py: 1.1,
                  }}
                  secondaryAction={
                    <Box>
                      <IconButton
                        disabled={idx === 0}
                        onClick={() => moveRank(idx, "up")}
                        sx={{ p: 0.7 }}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        disabled={idx === currentRanking.length - 1}
                        onClick={() => moveRank(idx, "down")}
                        sx={{ p: 0.7 }}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={`${rank}위 – ${player.name}`}
                    primaryTypographyProps={{ fontSize: "1rem" }}
                  />
                </ListItem>
              );
            })}

            {currentRanking.length === 0 && (
              <ListItem sx={{ width: "100%", py: 1.4 }}>
                <ListItemText
                  primary="참가자를 선택하면 순위를 정할 수 있어요."
                  primaryTypographyProps={{ fontSize: "0.95rem" }}
                />
              </ListItem>
            )}
          </List>
        </Paper>

        <Box
          mt={1.8}
          display="flex"
          justifyContent="flex-end"
          sx={{ width: "100%" }}
        >
          <Button
            variant="contained"
            size="medium"
            onClick={handleSaveRound}
            sx={{ px: 3, py: 1, fontSize: "0.95rem", borderRadius: 2 }}
          >
            이 라운드 저장
          </Button>
        </Box>
      </Box>
    </>
  );

  // --- 탭 2: 통계 ---
  const renderStatsTab = () => (
    <>
      <Box mb={3} sx={{ width: "100%" }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontSize: "1.05rem" }}>
          {selectedDate} 통계
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            width: "100%",
            borderRadius: 2,
          }}
        >
          <List sx={{ width: "100%" }}>
            {statsByPlayer.map((stat) => (
              <ListItem key={stat.player.id} sx={{ width: "100%", py: 1.1 }}>
                <ListItemText
                  primary={stat.player.name}
                  secondary={
                    stat.games === 0
                      ? "플레이 기록 없음"
                      : `플레이 ${stat.games}회 · 1위 ${stat.firstCount}회 · 평균 등수 ${
                          stat.avgRank?.toFixed(2) ?? "-"
                        }`
                  }
                  primaryTypographyProps={{ fontSize: "1rem" }}
                  secondaryTypographyProps={{ fontSize: "0.9rem" }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>

      <Box mb={6} sx={{ width: "100%" }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontSize: "1.05rem" }}>
          라운드 기록 ({selectedDate})
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            width: "100%",
            borderRadius: 2,
          }}
        >
          {rounds.filter((r) => r.date === selectedDate).length === 0 ? (
            <Box p={2.2}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.95rem" }}>
                아직 저장된 라운드가 없습니다.
              </Typography>
            </Box>
          ) : (
            <List sx={{ width: "100%" }}>
              {rounds
                .filter((r) => r.date === selectedDate)
                .map((round) => (
                  <React.Fragment key={round.id}>
                    <ListItem sx={{ width: "100%", py: 1 }}>
                      <ListItemText
                        primary={round.ranking
                          .map((pid, idx) => {
                            const p = playerMap[pid];
                            return `${idx + 1}위: ${p?.name ?? "?"}`;
                          })
                          .join(" · ")}
                        primaryTypographyProps={{ fontSize: "0.95rem" }}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
            </List>
          )}
        </Paper>
      </Box>
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
            py: 1, // 조금 더 두툼하게
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
            onChange={(e) => setSelectedDate(e.target.value)}
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

      {/* AppBar 높이만큼 여백 */}
      <Toolbar />

      {/* 메인 컨텐츠 영역 */}
      <Box
        component="main"
        sx={{
          width: "100%",
          boxSizing: "border-box",
          px: 2.2,
          pt: 2.2,
          pb: 11, // 아래 탭 높이 고려
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
            sx={{ "& .MuiBottomNavigationAction-label": { fontSize: "0.8rem" } }}
          />
          <BottomNavigationAction
            label="통계"
            icon={<BarChartIcon />}
            sx={{ "& .MuiBottomNavigationAction-label": { fontSize: "0.8rem" } }}
          />
        </BottomNavigation>
      </Box>
    </Box>
  );
};

export default MahjongFrontPage;
