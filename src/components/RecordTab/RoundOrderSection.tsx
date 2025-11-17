import React from 'react';
import { Box, Button, List, ListItem, ListItemText } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import { useAtom } from 'jotai';
import { currentRankingAtom, playerMapAtom } from '../../state/mahjongAtoms';
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

type Props = {
  onOpenConfirm: () => void;
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

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        width: '100%',
        py: 1.1,
        borderRadius: 1.5,
        mb: 0.3,
        cursor: 'grab',
        bgcolor: isDragging ? 'action.selected' : 'transparent',
        boxShadow: isDragging ? 3 : 0,
        // 살짝 커지는 느낌
        transformOrigin: 'center',
        '&:active': {
          cursor: 'grabbing',
        },
        transition: 'background-color 0.2s ease, box-shadow 0.15s ease',
      }}
      {...attributes}
      {...listeners}
    >
      <ListItemText
        primary={`${index + 1}위 – ${name}`}
        primaryTypographyProps={{ fontSize: '1rem' }}
      />
    </ListItem>
  );
};

export const RoundOrderSection: React.FC<Props> = ({ onOpenConfirm }) => {
  const [currentRanking, setCurrentRanking] = useAtom(currentRankingAtom);
  const [playerMap] = useAtom(playerMapAtom);

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
              <ListItem sx={{ width: '100%', py: 1.4 }}>
                <ListItemText
                  primary="참가자를 선택하면 순위를 정할 수 있어요."
                  primaryTypographyProps={{ fontSize: '0.95rem' }}
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
        <Button
          variant="contained"
          size="medium"
          onClick={onOpenConfirm}
          sx={{ px: 3, py: 1, fontSize: '0.95rem', borderRadius: 2 }}
        >
          이 라운드 저장
        </Button>
      </Box>
    </Section>
  );
};
