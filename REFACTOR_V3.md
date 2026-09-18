# Refactor V3

## 범위

이번 단계는 전체 통계 화면을 MUI에서 Tailwind CSS + Recharts로 전환했습니다.
기존 `GET /api/stats/all?start_date=&end_date=` API 형식은 변경하지 않았습니다.

## 변경 사항

- `AllTimeStatsSection.tsx`
  - MUI / Emotion / `Section` / `ScrollableTableContainer` 의존성 제거
  - 기간 필터 Tailwind 전환
  - 평균순위 / 1위율 / 연대율 / 4위율 지표 전환
  - Recharts 가로 BarChart 추가
  - 모바일 랭킹 카드 추가
  - 전체 상세 테이블은 접어서 필요할 때만 표시
  - 플레이어 클릭 시 요약 상세 Bottom Sheet / Dialog 표시
  - 플레이어 상세에서 평균순위, 1위율, 연대율, 4위율, 순위 분포 제공

## 데이터 흐름

```text
GET /api/stats/all
  -> AllPlayerTotalStats[]
  -> metricRows
     -> 랭킹 카드
     -> Recharts BarChart
  -> sortedRows
     -> 전체 상세 테이블
  -> selectedPlayer
     -> 플레이어 요약 상세
```

## 의도적으로 추가하지 않은 기능

현재 `/api/stats/all` 응답은 선택 기간의 최종 집계값만 제공합니다.
따라서 아래 값은 현재 데이터만으로 정확히 만들 수 없습니다.

- 월별 평균순위
- 일별 평균순위
- 최근 N게임 추세
- 장기 성적 변화

가짜 데이터나 프론트 추정을 넣지 않고, 다음 단계에서 서버에 최소 시계열 API를 추가할 예정입니다.

## 검증

```bash
cd mahjong-stat-front
npm install
npm run build
npm run dev
```

확인 항목:

1. 전체 기간 통계가 정상 조회되는지
2. 시작일/종료일 변경 시 통계가 다시 조회되는지
3. 시작일 > 종료일이면 요청하지 않고 오류를 표시하는지
4. 평균순위는 낮은 순으로 랭킹되는지
5. 1위율/연대율은 높은 순으로 랭킹되는지
6. 4위율은 낮은 순으로 랭킹되는지
7. 플레이어를 누르면 상세 통계가 열리는지
8. 전체 데이터 펼치기 및 열 정렬이 정상인지
9. 모바일 360px 폭에서 기간 입력과 랭킹 카드가 깨지지 않는지
10. 다크/라이트 모드에서 그래프/툴팁/테이블이 읽히는지
