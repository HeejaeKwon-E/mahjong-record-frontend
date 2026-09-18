# Refactor V9

V8 피드백에서 확인된 두 가지를 수정했습니다.

1. 일별 등수 흐름과 개인 최근 성적 그래프의 Y축 순위 라벨 잘림
2. 탭을 AppBar 아래에 붙인 구조를 MUI App Bar와 같은 단일 Toolbar 구조로 변경

백엔드 API와 데이터 형식은 변경하지 않았습니다.

## AppBar 구조

MUI 공식 App Bar의 역할에 맞춰 브랜딩, 내비게이션, 화면 액션을 하나의 Toolbar 안에 배치했습니다.

```text
┌──────────────────────────────────────────┐
│ 마작 기록  기록  일별  전체  나니키루  ◐ │  AppBar
└──────────────────────────────────────────┘

        ‹   2026-09-18 · 금요일   ›          날짜 컨트롤
```

### `src/pages/MahjongPage.tsx`

- 기존의 `날짜 Toolbar + 아래쪽 탭 줄` 2단 sticky header를 제거했습니다.
- 초록색 AppBar 안에 다음 요소를 한 줄로 배치했습니다.
  - 데스크톱/태블릿 브랜딩 `마작 기록`
  - 기록·일별·전체·나니키루 내비게이션
  - 다크 모드 on/off 버튼
- 390px 미만의 작은 화면에서는 탭 아이콘을 숨기고 텍스트를 유지해 네 항목과 테마 버튼이 한 줄에 들어가게 했습니다.
- 날짜 이전·선택·다음 버튼은 AppBar 밖의 별도 Material 카드로 이동했습니다.
- AppBar는 전체 화면 너비의 sticky surface이며 내부 콘텐츠만 `max-width: 720px`로 제한합니다.

## 그래프 Y축 잘림 수정

### `src/components/tab/dailyStatsTab/DailyScoreChart.tsx`

- 기존 `left: -20`을 `left: 8`로 변경했습니다.
- YAxis 폭을 `38`에서 `44`로 늘렸습니다.
- `tickMargin={6}`을 추가했습니다.

### `src/components/tab/allStatsTab/PlayerStatsDialog.tsx`

- 기존 `left: -14`를 `left: 8`로 변경했습니다.
- YAxis 폭을 `34`에서 `44`로 늘렸습니다.
- `tickMargin={6}`을 추가했습니다.

음수 여백이 `1위~4위` 텍스트를 카드 바깥으로 밀어내고, 부모의 overflow 영역에서 잘리게 한 것이 원인이었습니다. 두 그래프에 동일한 축 여백 규칙을 적용했습니다.

## 실행 및 검증

```bash
cd mahjong-stat-front
npm install
npm run lint
npm run build
npm run dev
```

확인 항목:

1. 320px, 360px, 390px 폭에서 AppBar가 한 줄로 유지되는지
2. 390px 미만에서는 탭 텍스트 네 개와 테마 버튼이 모두 보이는지
3. 390px 이상에서는 탭 아이콘도 함께 표시되는지
4. 다크 모드 버튼이 AppBar 안에서 정상 작동하는지
5. 날짜 컨트롤이 AppBar 아래에 독립된 카드로 표시되는지
6. 일별 등수 흐름의 `1위~4위` 라벨이 완전히 보이는지
7. 개인 최근 성적 그래프의 `1위~4위` 라벨이 완전히 보이는지
8. 탭 전환, 날짜 변경, 기록 저장 기능이 회귀하지 않았는지

검증 결과:

- `npm run lint`: 통과
- `npm run build`: 통과
- 백엔드/API: 변경 없음
