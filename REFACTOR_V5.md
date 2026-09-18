# Refactor V5

## 범위

이번 단계에서 나니키루 화면을 MUI에서 Tailwind CSS로 이전하고, 프로젝트에
남아 있던 MUI/Emotion 의존성과 레거시 공용 컴포넌트를 완전히 제거했습니다.
추가로 통계 차트와 나니키루 문제 데이터를 탭 단위로 지연 로딩해 기존 대형
초기 번들 경고도 해결했습니다.

## 변경 파일과 이유

- `src/components/mahjong/MahjongTile.tsx`
  - 숫자패, 자패, 적도라, 도라 표시패를 공통 렌더링
  - 키보드 포커스와 `aria-pressed`를 지원하는 실제 버튼 사용
- `src/components/tab/nanikiruTab/TodayNanikiruSection.tsx`
  - MUI 컴포넌트를 모두 Tailwind로 교체
  - Chip 선택 대신 화면의 손패를 직접 탭하는 UX 적용
  - 오답 후 선택 초기화, 최대 3회 시도, 해설/유효패 표시
  - 선택 날짜가 바뀌면 풀이 상태를 자동 초기화
- `src/components/tab/dailyStatsTab/DailyStatsTab.tsx`
  - 일별 차트와 히스토리를 하나의 지연 로딩 단위로 구성
- `src/pages/MahjongPage.tsx`
  - 일별/전체/나니키루 탭을 `React.lazy`와 `Suspense`로 분리
- `src/App.tsx`
  - MUI `ThemeProvider`, `CssBaseline`, `createTheme` 제거
  - 기존 CSS token 기반 라이트/다크 모드는 그대로 유지
- `src/index.css`
  - 마작패의 재질, 두께, 선택/쯔모 상태 스타일 추가
  - 누락돼 있던 `rounded-card`, `no-sb` 전역 유틸리티 정의
- `src/state/nanikiruAtoms.ts`
  - 렌더링 때마다 출력되던 디버그 `console.log` 제거
- `package.json`, `package-lock.json`
  - `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` 제거
- 삭제한 레거시 파일
  - `src/components/common/Section.tsx`
  - `src/components/common/ScrollableTableContainer.tsx`
  - `src/components/layout/SidebarMenu.tsx`
- `README.md`
  - 현재 기록 UX, 통계, 나니키루, 기술 스택 기준으로 갱신

백엔드와 기존 API에는 변경이 없습니다.

## 나니키루 데이터 흐름

```text
selectedDateAtom
  -> todayNanikiruProblemAtom
  -> NanikiruProblemView(key = 날짜 + 문제 ID)
     -> hand / tsumo 문자열 파싱
     -> nanikiruTilesAtom 메타데이터 결합
     -> MahjongTile 렌더링
     -> 패 선택 / 정답 확인 / 시도 횟수
     -> 정답 또는 3회 실패
     -> 모범 답안 / 해설 / 유효패 공개
```

문제 뷰의 React `key`에 날짜와 문제 ID를 모두 넣었기 때문에 날짜를 이동하면
`selectedLabel`, `tries`, `revealReason` 상태가 새 문제에 남지 않습니다.

## 번들 결과

V4 단일 JS 번들:

```text
1,025.66 kB (gzip 296.62 kB)
```

V5 초기 JS 번들:

```text
250.39 kB (gzip 79.69 kB)
```

지연 로딩 청크:

```text
DailyStatsTab          10.60 kB
AllTimeStatsSection    39.45 kB
TodayNanikiruSection  209.95 kB
LineChart             362.97 kB
```

모든 청크가 500KB 미만이며 Vite 대형 청크 경고가 발생하지 않습니다.

## 실행 및 검증

```bash
cd mahjong-stat-front
npm install
npm run build
npm run lint
npm run dev
```

확인 항목:

1. 기록 탭 첫 접속과 라이트/다크 모드가 기존처럼 동작하는지
2. 일별/전체/나니키루 탭을 처음 열 때 로딩 상태 후 화면이 표시되는지
3. 손패와 쯔모패가 가로 스크롤되고 쯔모패에 금색 테두리가 표시되는지
4. 손패를 누르면 선택 패가 위로 올라오고 다시 누르면 선택 해제되는지
5. 오답 후 선택이 초기화되고 남은 시도가 감소하는지
6. 정답 또는 세 번째 오답 후 손패와 버튼이 잠기고 해설이 표시되는지
7. 날짜를 이동하면 이전 선택, 시도 횟수, 해설 공개 상태가 초기화되는지
8. 적도라의 숫자와 중/발 색상이 정상인지
9. 모바일 360px와 태블릿 폭에서 손패/해설이 잘리지 않는지
10. `rg "@mui|@emotion" src package.json package-lock.json` 결과가 비어 있는지

## 검증 결과

- `npm run build`: 성공
- `npm run lint`: 성공
- MUI/Emotion 잔여 참조: 없음
- Vite 500KB 초과 청크 경고: 없음
