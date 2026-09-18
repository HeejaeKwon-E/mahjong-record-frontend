# Refactor V8

이번 변경은 Material 계열 디자인 통일, 상단 앱 바 내비게이션, 개인 통계의 최근 성적 그래프를 반영합니다. 백엔드 API와 저장 형식은 변경하지 않았습니다.

## 구현 방향

실제 `@mui/material`과 Emotion을 다시 설치하지 않고 Material 3의 시각 규칙을 현재 Tailwind 구조에 적용했습니다. 이렇게 하면 MUI와 Tailwind가 동시에 스타일을 소유하는 문제, Emotion 런타임 비용, 번들 증가 없이 요청한 디자인 방향을 유지할 수 있습니다.

## 변경 파일과 이유

### `src/index.css`

- 라이트·다크 색상을 Material 3 계열 semantic token으로 재정의했습니다.
- 다크 모드의 primary는 밝은 초록색을 유지했습니다.
- primary 위 글자색을 `on-jade`로 분리해 다크 모드에서도 대비를 보장합니다.
- 카드 elevation을 공통 `--shadow-1`, `--shadow-2`로 통일했습니다.
- UI 글꼴을 `Noto Sans KR` 하나의 계열로 통일했습니다.
- 기존 `font-mono`, `font-serif`, 과도한 800~900 합성 굵기는 전역에서 같은 글꼴과 최대 700 굵기로 정규화했습니다.
- 플레이어 선택 카드를 Material outlined/selected surface로 변경했습니다.

### `index.html`

- 문서 언어를 `ko`로 변경했습니다.
- Noto Sans KR 400/500/600/700을 로드합니다.
- 웹 폰트 로드에 실패하면 시스템 sans-serif로 안전하게 대체됩니다.

### `src/pages/MahjongPage.tsx`

- 하단 고정 내비게이션을 제거했습니다.
- 날짜 도구 모음 아래에 네 개의 탭을 가진 상단 Material 앱 바를 추가했습니다.
- 문자 기호 아이콘을 동일한 stroke 규칙의 SVG 아이콘으로 교체했습니다.
- 선택 탭은 초록색 글자와 3px indicator로 표시합니다.
- 하단 내비게이션이 사라진 만큼 본문 하단 여백과 Snackbar 위치를 줄였습니다.

### `src/components/tab/recordTab/RoundOrderSection.tsx`

- 저장 트레이의 sticky 기준을 기존 하단 내비게이션 위에서 화면 하단 12px로 변경했습니다.
- 선택 카드와 저장 버튼을 Material primary surface 및 pill 버튼 형태로 통일했습니다.

### 통계·나니키루 컴포넌트

- 영문 대문자 eyebrow와 서로 다른 숫자 글꼴을 제거했습니다.
- 카드 모서리, elevation, 제목 굵기와 primary 버튼을 동일한 규칙으로 맞췄습니다.
- 실제 마작패 자체는 정보 표현 요소이므로 기존 재질 표현을 유지했습니다.

### `src/components/tab/allStatsTab/PlayerStatsDialog.tsx`

- 월별 평균순위 계산과 그래프를 제거했습니다.
- API의 `recent_rounds`를 이용해 최근 최대 20게임의 실제 등수 흐름을 그래프로 표시합니다.
- API가 최신순으로 주는 배열을 복사한 후 뒤집어, 그래프는 왼쪽에서 오른쪽으로 과거→최신 순서가 되게 했습니다.
- Y축은 1위가 위, 4위가 아래이며 툴팁에서 날짜·시간·라운드 ID·등수를 확인할 수 있습니다.
- 기존 최근 성적 카드 목록은 중복이므로 제거했습니다.

## 개인 통계 데이터 흐름

```text
전체 통계 기간 + player_id
  → GET /api/stats/players/:playerId/history
  → recent_rounds (최신순 최대 20게임)
  → 프론트에서 원본을 복사하고 reverse
  → game/rank/dateLabel/roundId 그래프 데이터
  → 최근 성적 LineChart
```

`daily` 필드는 API 호환성을 위해 그대로 유지되지만 V8 개인 통계 화면에서는 사용하지 않습니다.

## 실행 및 검증

```bash
cd mahjong-stat-front
npm install
npm run lint
npm run build
npm run dev
```

확인 항목:

1. 라이트·다크 모드에서 Noto Sans KR 글꼴과 400~700 굵기가 일관적인지
2. 다크 모드 primary 초록색 버튼의 글자 대비가 충분한지
3. 상단 앱 바에서 기록·일별·전체·나니키루 탭이 전환되는지
4. 하단 내비게이션 공간이 제거되고 기록 저장 트레이가 화면 아래에 붙는지
5. 날짜 이동, 날짜 선택, 색상 모드 버튼이 기존처럼 작동하는지
6. 개인 통계에서 월별 평균순위 영역이 제거됐는지
7. 최근 성적 그래프가 과거→최신 순으로 표시되는지
8. 최근 성적 그래프의 1위가 위, 4위가 아래인지
9. 기간 필터가 개인 통계 API에도 동일하게 전달되는지
10. 기록 저장·일별 통계·전체 표·나니키루 기능이 회귀하지 않았는지

검증 결과:

- `npm run lint`: 통과
- `npm run build`: 통과
- 백엔드/API: 변경 없음
