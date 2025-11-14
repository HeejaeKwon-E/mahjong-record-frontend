// src/mahjong/components/Section.tsx
import { Box, Paper, Typography } from "@mui/material";
import React from "react";

type SectionProps = {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
};

export const Section: React.FC<SectionProps> = ({
  title,
  icon,
  children,
}) => {
  return (
    <Box mb={3} sx={{ width: "100%" }}>
      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          borderRadius: 2,
          p: 1.8,
          pt: 1.6,
          pb: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 1.6,
          }}
        >
          <Box
            sx={{
              width: 4,
              height: 24,
              borderRadius: 2,
              bgcolor: "primary.main",
              mr: 1.4,
            }}
          />
          {icon && (
            <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
              {icon}
            </Box>
          )}
          <Typography
            variant="subtitle1"
            sx={{ fontSize: "1.05rem", fontWeight: 600 }}
          >
            {title}
          </Typography>
        </Box>

        {children}
      </Paper>
    </Box>
  );
};
