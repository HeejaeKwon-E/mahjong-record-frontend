# Riichi Mahjong Frontend Refactor V1

## 이번 단계 범위

이번 V1은 전체 프론트엔드를 한 번에 갈아엎지 않고, 가장 자주 사용하는 **기록 흐름과 앱 셸**부터 Tailwind CSS v4로 옮긴 단계입니다.

### 변경됨

- Tailwind CSS v4 + `@tailwindcss/vite` 도입
- 상단 날짜 헤더를 Tailwind 기반 sticky header로 변경
- Drawer 메뉴 대신 모바일 하단 고정 네비게이션 적용
- 기록 탭 MUI 제거
- 기록 탭 dnd-kit 제거
- `세션 멤버`와 `이번 라운드 등수 초안` 상태 분리
- 등수 입력을 drag & drop에서 `1위 → 4위 순서대로 탭` 방식으로 변경
- 저장 후 세션 멤버 4명은 유지하고 등수 초안만 초기화
- 날짜 변경 시 이전 날짜를 fetch하던 stale closure 제거
- 날짜 연속 변경 시 이전 요청을 AbortController로 취소
- `useServerSync()` 중복 호출 제거

### 아직 유지됨

다음 화면은 기능 회귀를 막기 위해 V1에서는 기존 MUI 구현을 유지합니다.

- 일별 통계
- 라운드 기록 테이블/삭제 다이얼로그
- 전체 통계
- 나니키루
- `Section`, `ScrollableTableContainer`
- `ThemeProvider`, `CssBaseline`

따라서 V1에서는 MUI/Emotion dependency를 아직 제거하면 안 됩니다.

## 설치

기존 압축본에는 `package-lock.json`이 Git 기준 삭제 상태였으므로, 의존성 변경 후 lockfile을 새로 생성하는 것을 권장합니다.

```bash
cd mahjong-stat-front
rm -rf node_modules
npm install
```

## 실행

백엔드:

```bash
cd mahjong-stat-back
go run .
```

프론트엔드:

```bash
cd mahjong-stat-front
npm run dev
```

## 검증 순서

1. 오늘 날짜가 서버 `/api/server-date` 기준으로 표시되는지 확인
2. 플레이어 4명을 선택
3. 순위 결과에서 1위 → 4위 순서로 네 명을 탭
4. 하단 `이 라운드 저장` 버튼 활성화 확인
5. 저장 후
   - 세션 멤버 4명은 그대로인지
   - 등수 입력은 0/4로 초기화되는지
   - 일별 통계/라운드 기록에 저장 결과가 반영되는지 확인
6. 날짜를 빠르게 이전/다음으로 여러 번 이동해 마지막 날짜의 데이터만 남는지 확인
7. 과거 날짜에서는 새 라운드를 저장할 수 없는지 확인
8. 라이트/다크 모드에서 기록 화면과 기존 MUI 화면이 모두 읽기 가능한지 확인

## 다음 단계 권장 순서

1. 일별 통계 Tailwind 전환 + 라운드 카드 UI
2. Recharts로 당일 누적 벌점 그래프 추가
3. 전체 통계 Tailwind 전환 + 모바일 그래프 우선 UI
4. 개인 플레이어 상세 통계 API/화면 추가
5. 나니키루 Tailwind 전환
6. 남은 MUI/Emotion 완전 제거
7. 서버 상태를 TanStack Query로 이전
