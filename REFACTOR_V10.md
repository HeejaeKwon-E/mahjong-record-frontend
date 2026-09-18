# Refactor V10 — App Bar + Temporary Navigation Drawer

이번 단계에서는 상단에 모든 탭을 늘어놓던 구조를 제거하고, 요청한 형태의 **햄버거 메뉴 기반 우측 Drawer**로 변경했습니다.

## 화면 구조

- App Bar
  - 날짜 이전/다음 이동과 직접 선택
  - 햄버거 메뉴 버튼
- Temporary Navigation Drawer
  - 기록
  - 일별
  - 전체
  - 나니키루
  - 라이트/다크 모드 설정
- 콘텐츠
  - 날짜 선택 컨트롤
  - 현재 화면 내용

날짜와 햄버거 메뉴는 App Bar의 단일 Toolbar에 한 줄로 배치했습니다. 별도 앱 제목과 현재 화면명은 제거해 세로 공간을 줄였습니다. 색상 모드는 화면 이동이 아니라 앱 설정이므로 Drawer 하단에 분리했습니다.

## 변경 파일

### `src/components/layout/AppNavigation.tsx`

- App Bar와 Drawer를 별도 레이아웃 컴포넌트로 분리했습니다.
- App Bar 한 줄에서 날짜 이전/다음 이동, 달력 직접 선택, Drawer 열기를 제공합니다.
- 현재 화면은 강조 색상과 체크 아이콘으로 표시합니다.
- 메뉴를 선택하면 Drawer가 닫히고 선택 화면 상단으로 이동합니다.
- Backdrop 클릭, 닫기 버튼, `Escape` 키로 닫을 수 있습니다.
- 열린 동안 본문 스크롤을 잠그고, 키보드 포커스를 Drawer 내부에 유지합니다.
- 닫힌 뒤에는 포커스를 햄버거 메뉴 버튼으로 돌려보냅니다.
- Drawer 하단의 접근 가능한 Switch로 다크 모드를 전환합니다.

### `src/pages/MahjongPage.tsx`

- 기존 가로 4탭 App Bar 마크업을 제거했습니다.
- 화면 상태와 화면별 lazy loading은 그대로 유지하면서 `AppNavigation`만 연결했습니다.

### `src/index.css`

- Drawer Backdrop의 fade-in과 패널의 slide-in 모션을 추가했습니다.
- 운영체제의 `prefers-reduced-motion` 설정은 기존 전역 규칙으로 계속 존중합니다.

### `README.md`

- 실제 내비게이션 구조와 일치하도록 설명을 갱신했습니다.

## 유지된 이전 변경

- 등수 흐름/최근 성적 그래프의 좌측 Y축 여백 보정
- 전체 통계의 기본 전체 데이터 표
- 기록 탭의 접을 수 있는 멤버 영역
- 선택 멤버 기준 일별 통계 필터
- 날짜 직접 선택 기능
- Material 3 계열 색상, 표면, 타이포그래피 토큰

## 검증 항목

1. 햄버거 메뉴를 누르면 우측 Drawer가 열리는지
2. Backdrop, 닫기 버튼, `Escape`로 닫히는지
3. 현재 화면 항목이 강조되는지
4. 메뉴 선택 후 화면이 바뀌고 Drawer가 닫히는지
5. Drawer가 열린 동안 배경이 스크롤되지 않는지
6. 키보드 `Tab` 포커스가 Drawer 밖으로 빠져나가지 않는지
7. 라이트/다크 모드 Switch가 Drawer 안에서 정상 동작하는지
8. 날짜 이전/다음/직접 선택이 App Bar 한 줄에서 정상 동작하는지
9. 320px 모바일 폭에서 날짜와 햄버거 버튼이 겹치지 않는지
10. `npm run lint`와 `npm run build`가 통과하는지
