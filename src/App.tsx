import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { APP_TAB_PATHS } from './common/appRoutes';
import MahjongPage from './pages/MahjongPage';

export type ColorMode = 'light' | 'dark';

const getInitialMode = (): ColorMode => {
  const stored = localStorage.getItem('colorMode');
  return stored === 'dark' ? 'dark' : 'light';
};

/** Tailwind semantic token에 적용할 색상 모드를 관리합니다. */
function App() {
  const [mode, setMode] = useState<ColorMode>(getInitialMode);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    root.style.colorScheme = mode;
    localStorage.setItem('colorMode', mode);
  }, [mode]);

  const toggleColorMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // 네 URL에서 동일한 앱 셸을 사용합니다. 화면 상태는 URL을 통해 MahjongPage에 전달됩니다.
  // `/`와 존재하지 않는 경로는 기록 화면으로 이동합니다. 뒤로 가기 이력은 남기지 않습니다.
  const page = <MahjongPage mode={mode} toggleColorMode={toggleColorMode} />;
  return (
    <Routes>
      <Route path="/" element={<Navigate to={APP_TAB_PATHS.record} replace />} />
      {Object.values(APP_TAB_PATHS).map((path) => (
        <Route key={path} path={path} element={page} />
      ))}
      <Route path="*" element={<Navigate to={APP_TAB_PATHS.record} replace />} />
    </Routes>
  );
}

export default App;
