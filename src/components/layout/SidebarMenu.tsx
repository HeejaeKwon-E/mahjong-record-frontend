// src/mahjong/components/layout/SidebarMenu.tsx
import React from 'react';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import QuizIcon from '@mui/icons-material/Quiz';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

type SidebarMenuProps = {
  open: boolean;
  onClose: () => void;
  tab: number;
  onChangeTab: (tabIndex: number) => void;
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
  appVersion?: string;
};

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  open,
  onClose,
  tab,
  onChangeTab,
  mode,
  toggleColorMode,
  appVersion = 'v0.1.0',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const handleSelectTab = (index: number) => {
    onChangeTab(index);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? '60%' : 320, // 모바일: 화면 60%, 데스크탑: 320px
          },
        },
      }}
    >
      <Box
        sx={{
          height: '100%',
          pt: 2,
          pb: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 🔹 헤더: 메뉴 + 다크모드 */}
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

        {/* 🔹 메뉴 리스트 */}
        <List sx={{ flexGrow: 1 }}>
          <ListItemButton
            selected={tab === 0}
            onClick={() => handleSelectTab(0)}
          >
            <ListItemIcon>
              <EditNoteIcon />
            </ListItemIcon>
            <ListItemText primary="기록" />
          </ListItemButton>

          <ListItemButton
            selected={tab === 1}
            onClick={() => handleSelectTab(1)}
          >
            <ListItemIcon>
              <CalendarMonthIcon />
            </ListItemIcon>
            <ListItemText primary="일별 통계" />
          </ListItemButton>

          <ListItemButton
            selected={tab === 2}
            onClick={() => handleSelectTab(2)}
          >
            <ListItemIcon>
              <LeaderboardIcon />
            </ListItemIcon>
            <ListItemText primary="전체 통계" />
          </ListItemButton>
          <ListItemButton
            selected={tab === 3}
            onClick={() => handleSelectTab(3)}
          >
            <ListItemIcon>
              <QuizIcon />
            </ListItemIcon>
            <ListItemText primary="오늘의 나니키루" />
          </ListItemButton>
        </List>

        {/* 🔹 하단 버전 정보 (오른쪽 정렬) */}
        <Box
          sx={{
            mt: 1.5,
            pt: 1,
            px: 2,
            borderTop: 1,
            borderColor: 'divider',
            textAlign: 'right',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', fontSize: '0.75rem' }}
          >
            Mahjong Record
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 500, fontSize: '0.75rem' }}
          >
            {appVersion}
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};
