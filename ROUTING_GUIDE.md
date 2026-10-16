# 공유 링크 라우팅 구현 및 검증

## 추가된 기능

- 기록 `/record`, 일별 `/daily?date=YYYY-MM-DD`, 전체 `/all`, 나니키루 `/nanikiru`
- `/`에서 `/record`로 이동, 미등록 경로는 `/record`로 이동
- 일별 날짜 선택과 쿼리 문자열 연동
- 링크 직접 접속 및 새로고침 후 선택 날짜 복원
- 브라우저 뒤로 가기/앞으로 가기 시 화면·날짜 복원
- 잘못된 날짜 쿼리 정리 (예: `/daily?date=2026-02-31`)

## 수정 파일

| 파일 | 변경 |
|---|---|
| `src/common/appRoutes.ts` | 탭 URL/경로 매핑 및 올바른 날짜 파싱 |
| `src/main.tsx` | `BrowserRouter` 추가 |
| `src/App.tsx` | `Routes`, `Route`, 기본·미등록 경로 리다이렉트 |
| `src/pages/MahjongPage.tsx` | URL로 탭 결정 및 Jotai 날짜 연동 |
| `src/components/layout/AppNavigation.tsx` | 탭 타입 정의 위치를 공통 타입으로 통일 (UI 변경 없음) |
| `vite.config.ts` | 프록시 주석을 Rust 기준으로 정정 (실제 설정 값 변경 없음) |
| `package.json` | `react-router` 의존성과 단위 테스트 스크립트 추가 |
| `tests/appRoutes.test.mjs` | 탭 링크와 날짜 검증 테스트 |

## 설치 및 실행

```bash
npm install
npm run test:routes
npm run build
npm run dev
```

운영 환경은 `npm run build` 후 기존 Rust 백엔드의 `web/dist`에 정적 빌드 결과를 복사합니다.
Rust는 `/api` 경로를 기존 API로 처리하고, 그 외 SPA 경로는 `index.html`을 제공하고 있습니다.

## 화면 회귀 테스트

1. `/daily?date=2026-10-08` 직접 접속 → `2026-10-08` 날짜 및 해당 일별 데이터 표시
2. 날짜 이전/다음 버튼을 눌렀을 때 URL `date`도 변경되는지 확인
3. 다른 탭으로 이동했다가 브라우저 뒤로 이동 → URL에 명시된 탭·날짜 복원
4. `/all`, `/nanikiru` 직접 접속 및 새로고침 확인
5. `/` 접속 시 `/record` 이동 확인
6. `/daily?date=2026-02-31` 접속 시 잘못된 날짜가 정리되는지 확인
7. 기존 기록 등록/삭제, 전체 통계, 나니키루 풀이 동작 확인
8. API 404는 여전히 JSON 형태인지 확인

## 보안

공유 URL은 **읽기 전용 권한을 구현하지 않습니다**.
방문자에게 기록 수정 권한을 주지 않으려면 별도 관리자 인증 및 서버 API 권한 검증이 필요합니다.
