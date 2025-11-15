import React from 'react';
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { useAtom } from 'jotai';

import {
  roundsAtom,
  selectedDateAtom,
  playerMapAtom,
} from '../../state/mahjongAtoms';
import { Section } from '../Section';

export const RoundHistorySection: React.FC = () => {
  const [rounds] = useAtom(roundsAtom);
  const [selectedDate] = useAtom(selectedDateAtom);
  const [playerMap] = useAtom(playerMapAtom);

  const roundsForDate = rounds.filter((r) => r.date === selectedDate);

  return (
    <Section
      title={`라운드 기록 (${selectedDate})`}
      icon={<HistoryIcon fontSize="small" />}
    >
      {roundsForDate.length === 0 ? (
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
          {roundsForDate.map((round) => {
            const d = new Date(round.created_at);
            const timeStr = isNaN(d.getTime())
              ? ''
              : d.toLocaleTimeString('ko-KR', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                }); // 예: 14:23

            const rankingText = round.ranking
              .map((pid) => {
                const p = playerMap[pid];
                return `${p?.name ?? '?'}`;
              })
              .join(' · ');

            return (
              <React.Fragment key={round.id}>
                <ListItem sx={{ width: '100%', py: 1 }}>
                  <ListItemText
                    primary={
                      timeStr ? `${timeStr} · ${rankingText}` : rankingText
                    }
                    primaryTypographyProps={{ fontSize: '0.95rem' }}
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Section>
  );
};
