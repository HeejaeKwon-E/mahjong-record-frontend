import { useEffect, useState } from 'react';
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

  return <MahjongPage mode={mode} toggleColorMode={toggleColorMode} />;
}

export default App;
