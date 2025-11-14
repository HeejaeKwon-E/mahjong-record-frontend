// src/mahjong/components/RecordTab/PlayerSection.tsx
import React, { useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import GroupIcon from "@mui/icons-material/Group";
import { useAtom } from "jotai";

import {
  playersAtom,
  datePlayersAtom,
  selectedDateAtom,
  selectedPlayerIdsAtom,
  currentRankingAtom,
  currentDatePlayersAtom,
} from "../../state/mahjongAtoms";
import { Section } from "../Section";

type SnackbarHook = {
  showSnackbar: (msg: string, severity: "success" | "error") => void;
};

type Props = SnackbarHook;

export const PlayerSection: React.FC<Props> = ({ showSnackbar }) => {
  const [players, setPlayers] = useAtom(playersAtom);
  const [/*datePlayers*/, setDatePlayers] = useAtom(datePlayersAtom);
  const [selectedDate] = useAtom(selectedDateAtom);
  const [selectedPlayerIds, setSelectedPlayerIds] = useAtom(
    selectedPlayerIdsAtom
  );
  const [, setCurrentRanking] = useAtom(currentRankingAtom);
  const [currentDatePlayers] = useAtom(currentDatePlayersAtom);

  const [newPlayerName, setNewPlayerName] = useState("");

  const handleAddPlayer = () => {
    const trimmed = newPlayerName.trim();
    if (!trimmed) {
      showSnackbar("플레이어 이름을 입력해주세요.", "error");
      return;
    }

    let playerId: number;
    const existing = players.find((p) => p.name === trimmed);

    if (existing) {
      playerId = existing.id;
    } else {
      const nextId =
        players.length > 0
          ? Math.max(...players.map((p) => p.id)) + 1
          : 1;
      const newPlayer = { id: nextId, name: trimmed };
      setPlayers((prev) => [...prev, newPlayer]);
      playerId = nextId;
    }

    setDatePlayers((prev) => {
      const prevForDate = prev[selectedDate] ?? [];
      if (prevForDate.includes(playerId)) return prev;
      return {
        ...prev,
        [selectedDate]: [...prevForDate, playerId],
      };
    });

    setSelectedPlayerIds((prevSelected) => {
      if (prevSelected.includes(playerId) || prevSelected.length >= 4) {
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
    });

    setNewPlayerName("");
    showSnackbar("플레이어가 추가/연결되었습니다.", "success");
  };

  const handleToggleParticipant = (playerId: number) => {
    setSelectedPlayerIds((prevSelected) => {
      const isSelected = prevSelected.includes(playerId);

      if (isSelected) {
        const nextSelected = prevSelected.filter((id) => id !== playerId);
        setCurrentRanking((prev) =>
          prev.filter((id) => id !== playerId)
        );
        return nextSelected;
      } else {
        if (prevSelected.length >= 4) {
          showSnackbar(
            "한 라운드에는 최대 4명만 참가할 수 있습니다.",
            "error"
          );
          return prevSelected;
        }

        const nextSelected = [...prevSelected, playerId];

        setCurrentRanking((prev) => {
          const filtered = prev.filter((id) =>
            nextSelected.includes(id)
          );
          const added = nextSelected.filter((id) => !filtered.includes(id));
          return [...filtered, ...added];
        });

        return nextSelected;
      }
    });
  };

  return (
    <Section
      title={`플레이어 (참가자 ${selectedPlayerIds.length}/4)`}
      icon={<GroupIcon fontSize="small" />}
    >
      <Stack
        direction="row"
        spacing={1.2}
        useFlexGap
        sx={{
          width: "100%",
          pb: 1.5,
          flexWrap: "wrap",
        }}
      >
        {currentDatePlayers.map((player) => {
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
          placeholder="플레이어 이름 추가"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          InputProps={{
            sx: { fontSize: "0.98rem", py: 0.7 },
          }}
        />
        <IconButton color="primary" onClick={handleAddPlayer} sx={{ p: 1.2 }}>
          <AddIcon />
        </IconButton>
      </Box>
    </Section>
  );
};
