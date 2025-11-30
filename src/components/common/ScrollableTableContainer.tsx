// src/mahjong/components/common/ScrollableTableContainer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Box, TableContainer, type TableContainerProps } from '@mui/material';
import SwipeIcon from '@mui/icons-material/Swipe';

type Props = TableContainerProps & {
  children: React.ReactNode;
};

export const ScrollableTableContainer: React.FC<Props> = ({
  children,
  sx,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const hasHorizontalScroll = el.scrollWidth > el.clientWidth + 4;
    setShowHint(hasHorizontalScroll);
  }, [children]);

  const handleScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget;
    if (el.scrollLeft > 8 && showHint) {
      setShowHint(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'auto', // 🔒 이 박스를 기준으로 밖으로 못 나가게
      }}
    >
      <TableContainer
        {...rest}
        ref={ref}
        onScroll={handleScroll}
        sx={{
          width: '100%', // 🔴 핵심: 테이블 컨테이너 폭을 부모에 고정
          maxWidth: '100%',
          bgcolor: 'background.paper',
          overflowX: 'auto', // 좌우 스크롤은 이 안에서만
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            height: 6,
          },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: 3,
            bgcolor: 'divider',
          },
          ...sx,
        }}
      >
        {children}
      </TableContainer>

      {showHint && (
        <Box
          sx={{
            pointerEvents: 'none',
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 56,
            background:
              'linear-gradient(to left, rgba(0,0,0,0.22), rgba(0,0,0,0))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SwipeIcon
            sx={{
              fontSize: 20,
              opacity: 0.9,
            }}
          />
        </Box>
      )}
    </Box>
  );
};
