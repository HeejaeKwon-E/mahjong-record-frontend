import React from 'react';
import {
  //Box,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import { useAtom } from 'jotai';

import { statsByPlayerAtom, selectedDateAtom } from '../../state/mahjongAtoms';
import { Section } from '../Section';

export const StatsSummarySection: React.FC = () => {
  const [statsByPlayer] = useAtom(statsByPlayerAtom);
  const [selectedDate] = useAtom(selectedDateAtom);

  return (
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
              slotProps={{
                primary: {
                  fontSize: '1rem',
                },
                secondary: {
                  fontSize: '0.9rem',
                },
              }}
            />
          </ListItem>
        ))}
      </List>
    </Section>
  );
};
