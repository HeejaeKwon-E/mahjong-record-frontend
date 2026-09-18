import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

// Vite 개발 서버 설정입니다.
// - React SWC 플러그인으로 빠른 개발 빌드를 사용합니다.
// - Tailwind CSS v4는 별도 config 파일 없이 Vite 플러그인으로 연결합니다.
// - /api 요청은 기존과 동일하게 Go 백엔드(8080)로 프록시합니다.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
