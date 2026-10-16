import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { APP_TAB_PATHS, parseSharedDate, tabFromPath, tabUrl } from '../common/appRoutes';
import { useAtom, useSetAtom } from 'jotai';
import type { ColorMode } from '../App';
import {
  currentRankingAtom,
  selectedDateAtom,
  selectedPlayerIdsAtom,
  serverTodayAtom,
} from '../state/mahjongAtoms';
import { useServerSync } from '../hooks/useServerSync';
import { PlayerSection } from '../components/tab/recordTab/PlayerSection';
import { RoundOrderSection } from '../components/tab/recordTab/RoundOrderSection';
import { AppNavigation } from '../components/layout/AppNavigation';
import { usePlayersActions } from '../hooks/usePlayersActions';

// 차트 라이브러리와 대용량 나니키루 JSON을 첫 화면 번들에서 분리합니다.
// 사용자가 해당 탭을 처음 열 때만 관련 코드와 데이터를 내려받습니다.
const DailyStatsTab = lazy(
  () => import('../components/tab/dailyStatsTab/DailyStatsTab'),
);
const AllTimeStatsSection = lazy(() =>
  import('../components/tab/allStatsTab/AllTimeStatsSection').then(
    (module) => ({
      default: module.AllTimeStatsSection,
    }),
  ),
);
const TodayNanikiruSection = lazy(() =>
  import('../components/tab/nanikiruTab/TodayNanikiruSection').then(
    (module) => ({
      default: module.TodayNanikiruSection,
    }),
  ),
);

type FeedbackSeverity = 'success' | 'error' | 'info' | 'warning';

type MahjongPageProps = {
  mode: ColorMode;
  toggleColorMode: () => void;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: FeedbackSeverity;
};

const FEEDBACK_STYLE: Record<FeedbackSeverity, string> = {
  success: 'border-jade/40 bg-jade text-on-jade',
  error: 'border-vermilion/40 bg-vermilion text-on-vermilion',
  warning: 'border-gold/40 bg-gold text-on-gold',
  info: 'border-border bg-surface text-text',
};

function parseDateString(value: string | null | undefined): Date | null {
  if (!parseSharedDate(value ?? null)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateSubLabel(value: string, today: string | null) {
  const parsed = parseDateString(value);
  if (!parsed) return '';

  const weekday = ['일', '월', '화', '수', '목', '금', '토'][parsed.getDay()];
  return value === today ? `${weekday}요일 · 오늘` : `${weekday}요일`;
}

function TabLoadingFallback() {
  return (
    <div
      role="status"
      className="rounded-card border border-border bg-surface px-4 py-16 text-center text-sm text-muted"
    >
      화면을 불러오는 중입니다.
    </div>
  );
}

/**
 * 앱 셸과 네 개의 기능 탭을 관리합니다.
 *
 * 이번 단계의 핵심은 "기록 중 최소 터치"입니다.
 * - Material AppBar에는 제목, 날짜 선택, 햄버거 메뉴를 배치
 * - 화면 이동은 햄버거를 눌렀을 때 열리는 우측 Drawer에서 처리
 * - 색상 모드는 화면 설정이므로 Drawer 하단에서 처리
 * - 세션 멤버와 이번 라운드 순위를 분리
 * - 등수를 드래그하지 않고 1위부터 탭
 *
 * 일별/전체/나니키루는 탭 진입 시 지연 로딩해 초기 번들 크기를 제한합니다.
 */
export default function MahjongPage({
  mode,
  toggleColorMode,
}: MahjongPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const tab = tabFromPath(location.pathname);
  const rawUrlDate = tab === 'daily' ? new URLSearchParams(location.search).get('date') : null;
  const urlDate = parseSharedDate(rawUrlDate);
  // URL의 date는 주소가 변경된 시점에만 atom에 적용합니다.
  // 그렇지 않으면 날짜 선택 시 navigate 처리 전에 이전 URL이 새 날짜를 덮어쓸 수 있습니다.
  const lastAppliedLocationRef = useRef<string | null>(null);

  const { reloadDateData } = useServerSync();
  const [selectedDate, setSelectedDate] = useAtom(selectedDateAtom);
  const [serverToday, setServerToday] = useAtom(serverTodayAtom);
  const [draftRanking, setDraftRanking] = useAtom(currentRankingAtom);
  const setSessionPlayerIds = useSetAtom(selectedPlayerIdsAtom);
  const { reloadPlayers } = usePlayersActions();

  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = useCallback(
    (message: string, severity: FeedbackSeverity) => {
      setSnackbar({ open: true, message, severity });
    },
    [],
  );

  // 전체 플레이어는 앱 생명주기 동안 한 번만 불러옵니다.
  // 기록 탭을 닫았다 다시 열 때는 기존 atom 값을 그대로 사용합니다.
  useEffect(() => {
    void reloadPlayers();
  }, [reloadPlayers]);

  // 서버의 기준 날짜를 최초 한 번 받아옵니다. 클라이언트 timezone 추정에 의존하지 않습니다.
  useEffect(() => {
    if (serverToday) return;

    const controller = new AbortController();

    const fetchServerDate = async () => {
      try {
        const response = await fetch('/api/server-date', {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('failed to fetch server date');

        const data = await response.json();
        const today = typeof data?.today === 'string' ? data.today : '';
        if (!today) return;

        setServerToday(today);
        setSelectedDate((previous) => (previous.trim() ? previous : today));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        console.error('failed to load server date', error);
      }
    };

    void fetchServerDate();
    return () => controller.abort();
  }, [serverToday, setSelectedDate, setServerToday]);

  /**
   * URL → Jotai 날짜 동기화 (직접 접속 / 새로고침 / 뒤로 가기).
   *
   * 공유 링크가 열리거나 브라우저 히스토리로 URL이 바뀌었을 때만 URL 값을 적용합니다.
   * 단순한 selectedDate 변경에는 기존 URL 날짜를 다시 적용하지 않아,
   * 날짜 버튼에서 setSelectedDate + navigate를 연달아 호출해도 충돌하지 않습니다.
   */
  useEffect(() => {
    if (tab !== 'daily') {
      // 다른 화면에서 날짜를 바꾼 뒤 브라우저 뒤로 가기로 돌아와도 URL을 다시 읽습니다.
      lastAppliedLocationRef.current = null;
      return;
    }

    const locationId = `${location.key}:${location.pathname}:${location.search}`;
    if (lastAppliedLocationRef.current !== locationId) {
      lastAppliedLocationRef.current = locationId;

      if (rawUrlDate !== null && !urlDate) {
        // 잘못된 날짜는 안전하게 제거합니다(히스토리에 불필요한 방문 기록을 남기지 않음).
        navigate(APP_TAB_PATHS.daily, { replace: true });
        return;
      }

      if (urlDate && selectedDate !== urlDate) {
        // 새로 공유받은 날짜의 데이터가 이전 날짜의 입력 상태와 섞이지 않게 합니다.
        setSessionPlayerIds([]);
        setDraftRanking([]);
        setSelectedDate(urlDate);
        return;
      }
    }

    // `/daily`만 입력한 사용자는 기존에 선택한 날짜, 없으면 서버에서 가져온
    // 오늘 날짜로 `/daily?date=YYYY-MM-DD` 링크를 만들 수 있게 합니다.
    if (rawUrlDate === null && selectedDate) {
      navigate(tabUrl('daily', selectedDate), { replace: true });
    }
  }, [
    location.key, location.pathname, location.search, navigate,
    rawUrlDate, selectedDate, setDraftRanking, setSelectedDate,
    setSessionPlayerIds, tab, urlDate,
  ]);

  // 간단한 토스트는 별도 UI 라이브러리 없이 유지합니다. 2차에서 Sonner로 치환 가능합니다.
  useEffect(() => {
    if (!snackbar.open) return;
    const timer = window.setTimeout(() => {
      setSnackbar((previous) => ({ ...previous, open: false }));
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [snackbar.open, snackbar.message]);

  const handleDateChange = (nextDate: string) => {
    const normalized = nextDate.trim() || serverToday || '';
    if (!normalized || normalized === selectedDate) return;

    // 새 날짜의 데이터가 오기 전에 이전 날짜 참가자/초안이 보이지 않게 즉시 초기화합니다.
    setSessionPlayerIds([]);
    setDraftRanking([]);
    setSelectedDate(normalized);

    // 일별 화면에서는 날짜도 URL의 일부입니다. 다른 탭에서는 기존 UI 상태만 변경합니다.
    // navigate를 통해 브라우저 뒤로/앞으로 이동 시 이전 날짜를 다시 선택할 수 있습니다.
    if (tab === 'daily') {
      navigate(tabUrl('daily', normalized));
    }

    // useServerSync effect가 새 selectedDate로 자동 재조회하므로 여기서 수동 fetch하지 않습니다.
    // 이 방식으로 이전 closure를 참조하던 중복 요청을 제거합니다.
  };

  const shiftDate = (days: number) => {
    const base =
      parseDateString(selectedDate) ??
      parseDateString(serverToday) ??
      new Date();
    const next = new Date(base);
    next.setDate(base.getDate() + days);
    handleDateChange(toLocalDateString(next));
  };

  const handleSaveRound = async () => {
    if (draftRanking.length !== 4) {
      showSnackbar('1위부터 4위까지 모두 선택해주세요.', 'warning');
      return;
    }

    if (!serverToday || selectedDate !== serverToday) {
      showSnackbar('라운드는 오늘 날짜에만 저장할 수 있어요.', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          ranking: draftRanking,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '라운드 저장 실패');
      }

      // 서버가 저장한 값을 기준으로 일별 통계/히스토리를 다시 맞춥니다.
      // useServerSync는 세션 멤버는 유지하고 draftRanking만 비우도록 구현되어 있습니다.
      await reloadDateData(selectedDate);
      showSnackbar('라운드를 저장했습니다.', 'success');
    } catch (error) {
      console.error(error);
      showSnackbar('라운드 저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-bg text-text">
      <AppNavigation
        currentTab={tab}
        mode={mode}
        selectedDate={selectedDate || serverToday || ''}
        dateSubLabel={
          formatDateSubLabel(selectedDate || serverToday || '', serverToday) ||
          '눌러서 날짜 선택'
        }
        onToggleColorMode={toggleColorMode}
        onDateChange={handleDateChange}
        onShiftDate={shiftDate}
        onTabChange={(nextTab) => {
          // 이전의 로컬 tab state 대신 주소를 이동시키고, 현재 날짜는 일별 공유 링크에만 포함합니다.
          if (nextTab !== tab) navigate(tabUrl(nextTab, selectedDate || serverToday || ''));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <div className="mx-auto min-h-dvh w-full max-w-[720px]">
        <main className="px-4 pb-10 pt-6 sm:px-6">
          {tab === 'record' && (
            <div className="mx-auto max-w-[480px]">
              {/* 날짜가 바뀌면 접힘 상태도 새 날짜의 세션 멤버 기준으로 초기화합니다. */}
              <PlayerSection key={selectedDate} showSnackbar={showSnackbar} />
              <RoundOrderSection
                isSaving={isSaving}
                onSave={() => void handleSaveRound()}
              />
            </div>
          )}

          {tab === 'daily' && (
            <Suspense fallback={<TabLoadingFallback />}>
              <DailyStatsTab
                reloadDateData={reloadDateData}
                showSnackbar={showSnackbar}
              />
            </Suspense>
          )}

          {tab === 'all' && (
            <Suspense fallback={<TabLoadingFallback />}>
              <AllTimeStatsSection />
            </Suspense>
          )}
          {tab === 'nanikiru' && (
            <Suspense fallback={<TabLoadingFallback />}>
              <TodayNanikiruSection />
            </Suspense>
          )}
        </main>
      </div>

      {snackbar.open && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div
            role="status"
            className={`max-w-sm rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl ${FEEDBACK_STYLE[snackbar.severity]}`}
          >
            {snackbar.message}
          </div>
        </div>
      )}
    </div>
  );
}
