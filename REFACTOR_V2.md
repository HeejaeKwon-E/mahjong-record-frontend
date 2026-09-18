# Riichi Mahjong Record - Refactor V2

## 이번 단계

V1의 모바일 기록 화면에 이어 일별 통계 화면을 Tailwind CSS 기반으로 전환했습니다.
백엔드 API와 기존 데이터 형식은 변경하지 않았습니다.

### 변경 파일

- `src/components/tab/dailyStatsTab/StatsSummarySection.tsx`
  - MUI Table 제거
  - 모바일 카드형 일별 성적 UI
  - 점수, 게임 수, 1위 수, 평균 순위를 한 카드에서 확인
- `src/components/tab/dailyStatsTab/DailyScoreChart.tsx`
  - Recharts 기반 라운드별 누적 벌점 그래프 추가
  - 1위 0 / 2위 1 / 3위 3 / 4위 6 규칙 유지
  - 낮은 점수가 위로 보이도록 Y축 반전
  - 범례를 탭해 특정 플레이어 강조 가능
- `src/components/tab/dailyStatsTab/RoundHistorySection.tsx`
  - MUI Table/Dialog 제거
  - 모바일 카드형 라운드 히스토리
  - 기존 DELETE `/api/rounds/:id` 동작 유지
  - 중복 삭제 방지 상태 추가
- `package.json`
  - `recharts` 추가
  - Recharts React 19 peer dependency 대응을 위해 `react-is` 추가

## 데이터 흐름

```text
GET /api/rounds/by-date
        ↓
useServerSync
        ↓
roundsAtom
        ├─ statsByPlayerAtom → 일별 플레이어 카드
        ├─ DailyScoreChart   → 누적 벌점 그래프
        └─ RoundHistory      → 라운드 기록 / 삭제
```

## 실행

```bash
cd mahjong-stat-front
npm install
npm run dev
```

프로덕션 빌드 검증:

```bash
npm run build
npm run lint
```

## 확인 항목

1. 라운드가 없는 날짜에서 빈 상태 UI 확인
2. 기록 탭에서 라운드 2~3개 저장
3. 일별 탭에서 카드 순서가 누적 벌점 오름차순인지 확인
4. 점수 흐름 그래프가 라운드 증가에 따라 누적되는지 확인
5. 그래프 범례를 눌렀을 때 다른 플레이어 선이 흐려지는지 확인
6. 오늘 날짜에서 라운드 삭제 버튼이 보이는지 확인
7. 과거 날짜에서는 삭제 버튼이 숨겨지는지 확인
8. 삭제 후 카드/그래프/히스토리가 모두 즉시 갱신되는지 확인
9. 라이트/다크 모드에서 차트 Tooltip과 카드 가독성 확인
10. 모바일 360px~430px, 태블릿/PC 폭에서 레이아웃 확인

## 다음 단계

- 전체 통계를 Tailwind + Recharts 기반으로 재설계
- metric switch: 평균순위 / 1위율 / 연대율 / 4위율
- 기간 필터
- 플레이어 상세 통계 화면을 위한 API/화면 설계
- 전체/나니키루까지 이관 후 MUI + Emotion 완전 제거
