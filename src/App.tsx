// App.tsx
import React, { useMemo, useState } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import MahjongFrontPage from "./MahjongFrontPage";

const App: React.FC = () => {
  // localStorage에서 모드 불러오기
  const storedMode = (localStorage.getItem("colorMode") as "light" | "dark") ?? "light";

  const [mode, setMode] = useState<"light" | "dark">(storedMode);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === "light" ? "#1976d2" : "#90caf9",
          },
          background: {
            default: mode === "light" ? "#fafafa" : "#121212",
            paper: mode === "light" ? "#fff" : "#1e1e1e",
          },
        },
        shape: {
          borderRadius: 10,
        },
      }),
    [mode]
  );

  const toggleColorMode = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    localStorage.setItem("colorMode", next); // 저장
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MahjongFrontPage toggleColorMode={toggleColorMode} mode={mode} />
    </ThemeProvider>
  );
};

export default App;
