// src/mahjong/components/Section.tsx
import React, { useState } from 'react';
import { Box, Paper, Typography, IconButton, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

type SectionProps = {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** 접었다 펴는 기능 사용할지 여부 (기본: false) */
  collapsible?: boolean;
  /** collapsible=true 일 때 기본으로 펼쳐둘지 여부 (기본: true) */
  defaultExpanded?: boolean;
};

export const Section: React.FC<SectionProps> = ({
  title,
  icon,
  children,
  collapsible = false,
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    if (!collapsible) return;
    setExpanded((prev) => !prev);
  };

  return (
    <Box mb={2.2} sx={{ width: '100%' }}>
      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          borderRadius: 2,
          p: 1.6,
          pb: collapsible && !expanded ? 1.3 : 2,
        }}
      >
        {/* 헤더 영역 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: collapsible && !expanded ? 0 : 1.4,
            cursor: collapsible ? 'pointer' : 'default',
          }}
          onClick={handleToggle}
        >
          {/* 왼쪽 컬러 바 */}
          <Box
            sx={{
              width: 4,
              height: 22,
              borderRadius: 2,
              bgcolor: 'primary.main',
              mr: 1.2,
            }}
          />

          {/* 아이콘 + 타이틀 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            {icon && (
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                {icon}
              </Box>
            )}
            <Typography
              variant="subtitle1"
              sx={{ fontSize: '1.05rem', fontWeight: 600 }}
              noWrap
            >
              {title}
            </Typography>
          </Box>

          {/* 우측 접기/펼치기 아이콘 */}
          {collapsible && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              sx={{
                ml: 0.5,
                transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* 내용부: Collapse로 감싸기 */}
        {collapsible ? (
          <Collapse in={expanded} timeout="auto" unmountOnExit={false}>
            {children}
          </Collapse>
        ) : (
          children
        )}
      </Paper>
    </Box>
  );
};
