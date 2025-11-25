// src/mahjong/components/RecordTab/RoundOrderSection.tsx
import React from 'react';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import { useAtom } from 'jotai';
import {
  currentRankingAtom,
  playerMapAtom,
  selectedDateAtom,
} from '../../state/mahjongAtoms';
import { Section } from '../Section';

// dnd-kit
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { amber, brown, grey } from '@mui/material/colors';

type Props = {
  onOpenConfirm: () => void;
};

/** 순위 뱃지 색상 헬퍼 */
const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      // 🥇 금색: 살짝 밝은 호박색 계열
      return amber[400]; // or amber[500]
    case 2:
      // 🥈 은색: 밝은 회색
      return grey[300]; // or grey[400]
    case 3:
      // 🥉 동색: 주황/갈색 계열
      return brown[500]; // or deepOrange[500]
    default:
      // 그 외: 흐린 회색
      return ''; //grey[500];
  }
};
const getRankTextColor = (rank: number) => {
  switch (rank) {
    case 1:
      // amber[400] 바탕엔 진한 글자가 잘 보임
      return 'black';
    case 2:
      return 'black'; // grey[300]도 밝아서 검정이 잘 보임
    case 3:
      return 'common.white'; // deepOrange[400] 위에는 흰색
    default:
      return ''; //'common.white';
  }
};

/** 개별 플레이어 한 줄 (드래그 가능한 행) */
type SortableRowProps = {
  id: number;
  index: number;
  name: string;
};

const SortableRow: React.FC<SortableRowProps> = ({ id, index, name }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const rank = index + 1;

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        width: '100%',
        py: 1.1,
        px: 1.3,
        mb: 0.6,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isDragging ? 'primary.main' : 'divider',
        bgcolor: isDragging ? 'action.selected' : 'background.paper',
        boxShadow: isDragging ? 3 : 0,
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: 1.4,
        '&:active': {
          cursor: 'grabbing',
        },
        transition:
          'background-color 0.2s ease, box-shadow 0.15s ease, border-color 0.15s ease',
      }}
      // 🔹 이제 행 전체가 드래그 영역
      {...attributes}
      {...listeners}
    >
      {/* 순위 뱃지 */}
      <ListItemIcon
        sx={{
          minWidth: 0,
          mr: 1.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: getRankColor(rank),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: getRankTextColor(rank),
            fontSize: '0.9rem',
            fontWeight: 700,
          }}
        >
          {rank}
        </Box>
      </ListItemIcon>

      {/* 이름 텍스트 */}
      <ListItemText
        primary={name}
        primaryTypographyProps={{
          fontSize: '1rem',
          fontWeight: 500,
        }}
      />

      {/* 드래그 가능 힌트용 아이콘 (실제 드래그 리스너는 없음) */}
      <IconButton
        edge="end"
        size="small"
        sx={{ ml: 1, cursor: 'inherit' }} // 행 전체가 grab 이니까 얘도 맞춰줌
        disableRipple
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>
    </ListItem>
  );
};

export const RoundOrderSection: React.FC<Props> = ({ onOpenConfirm }) => {
  const [currentRanking, setCurrentRanking] = useAtom(currentRankingAtom);
  const [playerMap] = useAtom(playerMapAtom);
  const [selectedDate] = useAtom(selectedDateAtom); // 🔹 현재 선택된 날짜

  const today = new Date().toISOString().slice(0, 10); // 🔹 오늘 문자열
  const isToday = selectedDate === today;

  // 마우스 + 터치 센서 (모바일에서도 드래그 되게)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6, // 6px 이상 움직였을 때만 드래그 시작 (실수 터치 방지)
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setCurrentRanking((prev) => {
      const oldIndex = prev.indexOf(active.id as number);
      const newIndex = prev.indexOf(over.id as number);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  return (
    <Section
      title="이번 라운드 등수"
      icon={<EmojiEventsIcon fontSize="small" />}
    >
      {/* 안내 텍스트 */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1.2, fontSize: '0.85rem' }}
      >
        순위를 바꾸려면 행을 길게 눌러 위/아래로 드래그하세요.
      </Typography>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={currentRanking}
          strategy={verticalListSortingStrategy}
        >
          <List sx={{ width: '100%' }}>
            {currentRanking.map((pid, idx) => {
              const player = playerMap[pid];
              if (!player) return null;
              return (
                <SortableRow
                  key={pid}
                  id={pid}
                  index={idx}
                  name={player.name}
                />
              );
            })}

            {currentRanking.length === 0 && (
              <ListItem
                sx={{
                  width: '100%',
                  py: 1.4,
                  display: 'flex',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <ListItemText
                  primary="참가자를 선택하면 순위를 정할 수 있어요."
                  slotProps={{
                    primary: {
                      fontSize: '0.95rem',
                      textAlign: 'center',
                      width: '100%',
                    },
                  }}
                  sx={{ textAlign: 'center', width: '100%' }}
                />
              </ListItem>
            )}
          </List>
        </SortableContext>
      </DndContext>

      <Box
        mt={1.8}
        display="flex"
        justifyContent="flex-end"
        sx={{ width: '100%' }}
      >
        {isToday ? (
          <Button
            variant="contained"
            size="medium"
            onClick={onOpenConfirm}
            sx={{ px: 3, py: 1, fontSize: '0.95rem', borderRadius: 2 }}
          >
            이 라운드 저장
          </Button>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: '0.85rem' }}
          >
            라운드는 오늘 날짜에만 저장할 수 있어요.
          </Typography>
        )}
      </Box>
    </Section>
  );
};
