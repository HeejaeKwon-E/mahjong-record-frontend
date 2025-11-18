// src/mahjong/components/RecordTab/PlayerSection.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import { useAtom } from 'jotai';

import {
  selectedPlayerIdsAtom,
  currentRankingAtom,
  playersAtom,
} from '../../state/mahjongAtoms';
import { Section } from '../Section';
import { usePlayersActions } from '../../hooks/usePlayersActions';

type PlayerSectionProps = {
  showSnackbar: (
    msg: string,
    severity: 'success' | 'error' | 'info' | 'warning',
  ) => void;
};

export const PlayerSection: React.FC<PlayerSectionProps> = ({
  showSnackbar,
}) => {
  const { reloadPlayers } = usePlayersActions(); // ✅ 이제는 사이드이펙트 없음
  const [, setCurrentRanking] = useAtom(currentRankingAtom);
  const [players] = useAtom(playersAtom);
  const [selectedPlayerIds, setSelectedPlayerIds] = useAtom(
    selectedPlayerIdsAtom,
  );
  const [newPlayerName, setNewPlayerName] = useState('');
  // 🔹 "플레이어 추가" 확인 다이얼로그 상태
  const [isAddConfirmOpen, setIsAddConfirmOpen] = useState(false);

  const handleOpenAddConfirm = () => {
    const trimmed = newPlayerName.trim();
    if (!trimmed) {
      showSnackbar('이름을 입력해주세요.', 'warning');
      return;
    }
    // 여기서는 아직 서버 호출 안 하고, 단지 "정말 추가할래?"만 묻는다
    setIsAddConfirmOpen(true);
  };

  const handleCloseAddConfirm = () => {
    setIsAddConfirmOpen(false);
  };
  const handleAddPlayer = async () => {
    const trimmed = newPlayerName.trim();
    if (!trimmed) {
      setIsAddConfirmOpen(false);
      showSnackbar('이름을 입력해주세요.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '플레이어 추가 실패');
      }

      // 여기서 응답으로 온 단일 player를 push하지 않고,
      // 서버 전체 목록을 다시 받아와서 정확한 상태로 덮어씀
      await reloadPlayers();

      setNewPlayerName('');
      setIsAddConfirmOpen(false);
      showSnackbar('플레이어를 추가했습니다.', 'success');
    } catch (err) {
      console.error(err);
      setIsAddConfirmOpen(false);
      showSnackbar('플레이어 추가 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleToggleParticipant = (playerId: number) => {
    setSelectedPlayerIds((prevSelected) => {
      const isSelected = prevSelected.includes(playerId);

      if (isSelected) {
        const nextSelected = prevSelected.filter((id) => id !== playerId);
        setCurrentRanking((prev) => prev.filter((id) => id !== playerId));
        return nextSelected;
      } else {
        if (prevSelected.length >= 4) {
          showSnackbar('한 라운드에는 최대 4명만 참가할 수 있습니다.', 'error');
          return prevSelected;
        }

        const nextSelected = [...prevSelected, playerId];

        setCurrentRanking((prev) => {
          const filtered = prev.filter((id) => nextSelected.includes(id));
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
          width: '100%',
          pb: 1.5,
          flexWrap: 'wrap',
        }}
      >
        {players.map((player) => {
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
        <IconButton
          color="primary"
          onClick={handleOpenAddConfirm}
          sx={{ p: 1.2 }}
        >
          <AddIcon />
        </IconButton>
      </Box>

      {/* 🔹 플레이어 추가 확인 다이얼로그 */}
      <Dialog open={isAddConfirmOpen} onClose={handleCloseAddConfirm} fullWidth>
        <DialogTitle>플레이어를 추가할까요?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            새 플레이어 이름:
          </DialogContentText>
          <DialogContentText sx={{ fontWeight: 600 }}>
            “{newPlayerName.trim()}”
          </DialogContentText>
          <DialogContentText sx={{ mt: 1.5 }} color="text.secondary">
            이미 존재하는 이름과 겹칠 수 있으니 한 번 더 확인해 주세요.
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'space-between',
            px: 3,
            pb: 2,
            gap: 2,
          }}
        >
          <Button onClick={handleCloseAddConfirm}>취소</Button>
          <Button onClick={handleAddPlayer} variant="contained" color="primary">
            추가
          </Button>
        </DialogActions>
      </Dialog>
    </Section>
  );
};
