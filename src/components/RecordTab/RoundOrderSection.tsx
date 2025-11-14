// src/mahjong/components/RecordTab/RoundOrderSection.tsx
import React, { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

import { useAtom } from "jotai";
import {
  currentRankingAtom,
  playerMapAtom,
  //roundsAtom,
  //selectedDateAtom,
} from "../../state/mahjongAtoms";
import { Section } from "../Section";

type Props = {
  onOpenConfirm: () => void;
};

export const RoundOrderSection: React.FC<Props> = ({ onOpenConfirm }) => {
  const [currentRanking, setCurrentRanking] = useAtom(currentRankingAtom);
  const [playerMap] = useAtom(playerMapAtom);

  // 애니메이션용 로컬 state
  const [lastMovedId, setLastMovedId] = useState<number | null>(null);
  const [lastSwappedId, setLastSwappedId] = useState<number | null>(null);

  const moveRank = (index: number, direction: "up" | "down") => {
    setCurrentRanking((prev) => {
      const newOrder = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newOrder.length) return prev;

      const primaryId = newOrder[index];
      const secondaryId = newOrder[targetIndex];

      [newOrder[index], newOrder[targetIndex]] = [
        newOrder[targetIndex],
        newOrder[index],
      ];

      setLastMovedId(primaryId);
      setLastSwappedId(secondaryId);

      setTimeout(() => {
        setLastMovedId((cur) => (cur === primaryId ? null : cur));
        setLastSwappedId((cur) => (cur === secondaryId ? null : cur));
      }, 300);

      return newOrder;
    });
  };

  return (
    <Section
      title="이번 라운드 등수"
      icon={<EmojiEventsIcon fontSize="small" />}
    >
      <List sx={{ width: "100%" }}>
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
                width: "100%",
                py: 1.1,
                borderRadius: 1.5,
                mb: 0.3,
                bgcolor: isPrimaryMoved ? "action.selected" : "transparent",
                transform: isPrimaryMoved ? "scale(1.03)" : "scale(1)",
                boxShadow: isPrimaryMoved ? 3 : 0,
                border: isSecondaryMoved
                  ? "1px solid"
                  : "1px solid transparent",
                borderColor: isSecondaryMoved ? "divider" : "transparent",
                transition:
                  "background-color 0.20s ease, transform 0.12s ease, box-shadow 0.12s ease, border-color 0.20s ease",
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
      </List>

      <Box
        mt={1.8}
        display="flex"
        justifyContent="flex-end"
        sx={{ width: "100%" }}
      >
        <Button
          variant="contained"
          size="medium"
          onClick={onOpenConfirm}
          sx={{ px: 3, py: 1, fontSize: "0.95rem", borderRadius: 2 }}
        >
          이 라운드 저장
        </Button>
      </Box>
    </Section>
  );
};
