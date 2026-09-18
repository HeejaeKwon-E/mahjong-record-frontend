# Refactor V4

## 범위

이번 단계는 V3 전체 통계에서 열던 플레이어 요약 패널을 실제 시계열 API와
연결해 개인 통계 상세 화면으로 완성했습니다. 기존 API 응답은 변경하지 않고
개인 통계 API를 추가했습니다.

## 변경 파일과 이유

### 백엔드

- `internal/domain/domain.go`
  - 개인 통계 응답 DTO, 일별 통계, 최근 라운드 타입 추가
- `internal/repository/repository.go`
  - 플레이어 기본 정보 조회와 기간별 개인 라운드 조회 추가
- `internal/service/service.go`
  - 날짜 검증, 요약/일별/최근 20게임 계산 추가
- `internal/api/handler.go`, `internal/api/router.go`
  - 개인 통계 API와 400/404/500 오류 매핑 추가
- `internal/schema/schema.go`
  - `player_id` 기반 개인 통계 조회와 기간 정렬용 인덱스 추가
- `internal/service/service_test.go`
  - 전체 기간, 기간 필터, 최근순 정렬, 입력 검증 테스트 추가
- `README.md`
  - 요청/응답/오류/`curl` 문서 추가

### 프론트엔드

- `src/common/types.ts`
  - 개인 통계 API 응답 타입 추가
- `src/components/tab/allStatsTab/PlayerStatsDialog.tsx`
  - 기간 요약 KPI
  - 일별 통계를 정확히 가중 집계한 월별 평균순위 그래프
  - 등수별 분포
  - 최신순 최근 20게임
  - API 로딩/오류/빈 데이터 상태
- `src/components/tab/allStatsTab/AllTimeStatsSection.tsx`
  - 기존 요약 패널을 개인 통계 상세 컴포넌트로 교체
  - 기간 오류를 파생 값으로 변경해 불필요한 effect 상태 갱신 제거
- `src/components/tab/nanikiruTab/TodayNanikiruSection.tsx`
  - 조건부 Hook과 `any` 타입만 정리해 기존 기능을 바꾸지 않고 lint 오류 제거
- `package-lock.json`
  - 현재 `package.json` 의존성 기준으로 다시 생성

## API

```http
GET /api/stats/players/:playerId/history
    ?start_date=2026-01-01
    &end_date=2026-09-30
```

기존 API는 그대로 유지합니다.

```http
GET /api/stats/all
GET /api/stats/all?start_date=2026-01-01&end_date=2026-09-30
```

## 데이터 흐름

```text
전체 통계 기간 필터
  -> GET /api/stats/all
  -> 플레이어 선택
  -> GET /api/stats/players/:playerId/history (동일 기간)
  -> summary      -> KPI
  -> rank_counts  -> 순위 분포
  -> daily        -> 월별 가중 평균순위 그래프
  -> recent_rounds -> 최근 20게임
```

월별 평균순위는 일별 평균을 단순 평균하지 않습니다. 날짜별 등수 횟수에서
`1위*1 + 2위*2 + 3위*3 + 4위*4`를 복원한 뒤 월 게임 수로 나누므로,
하루 게임 수가 서로 달라도 정확한 가중 평균이 유지됩니다.

## 실행 및 검증

백엔드:

```bash
cd mahjong-stat-back
go test ./...
go run .
```

API 정상 응답:

```bash
curl -i "http://localhost:8080/api/stats/players/1/history"
curl -i "http://localhost:8080/api/stats/players/1/history?start_date=2026-01-01&end_date=2026-09-30"
```

오류 응답:

```bash
curl -i "http://localhost:8080/api/stats/players/abc/history"
curl -i "http://localhost:8080/api/stats/players/1/history?start_date=2026-13-01"
curl -i "http://localhost:8080/api/stats/players/1/history?start_date=2026-09-30&end_date=2026-01-01"
curl -i "http://localhost:8080/api/stats/players/999999/history"
```

프론트엔드:

```bash
cd mahjong-stat-front
npm install
npm run build
npm run lint
npm run dev
```

화면 확인 항목:

1. 전체 통계의 기간을 바꾼 뒤 플레이어를 누르면 상세도 같은 기간인지
2. KPI 값이 바깥 전체 통계 값과 일치하는지
3. 월별 그래프의 Y축에서 1위가 위, 4위가 아래인지
4. 최근 성적이 최신순이고 최대 20게임인지
5. 기록이 없는 기간에서 빈 상태가 정상인지
6. 모바일 360px와 태블릿 폭에서 상세 화면이 잘리지 않는지
7. Escape, 닫기 버튼, 바깥 영역 클릭으로 상세 화면이 닫히는지
8. 라이트/다크 모드에서 그래프와 등수 색상이 읽히는지

## 검증 결과

- `npm run build`: 성공
- `npm run lint`: 성공
- Go 테스트 코드는 추가했으나 현재 산출물 생성 환경에 Go 실행 파일이 없어
  이 환경에서 `go test ./...`는 실행하지 못했습니다. Go 1.24 이상이 설치된
  프로젝트 환경에서 위 명령으로 확인해야 합니다.
