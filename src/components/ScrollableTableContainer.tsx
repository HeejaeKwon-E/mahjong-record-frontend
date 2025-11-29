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
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TableContainer
        {...rest}
        ref={ref}
        onScroll={handleScroll}
        sx={{
          bgcolor: 'background.paper',
          maxWidth: '100%',
          overflowX: 'auto',
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
