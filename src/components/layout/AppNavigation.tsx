import { useEffect, useRef, useState } from 'react';
import type { ColorMode } from '../../App';

export type AppTab = 'record' | 'daily' | 'all' | 'nanikiru';

type AppNavigationProps = {
  currentTab: AppTab;
  mode: ColorMode;
  selectedDate: string;
  dateSubLabel: string;
  onTabChange: (tab: AppTab) => void;
  onToggleColorMode: () => void;
  onDateChange: (date: string) => void;
  onShiftDate: (days: number) => void;
};

const TAB_ITEMS: Array<{
  key: AppTab;
  label: string;
  description: string;
}> = [
  { key: 'record', label: '기록', description: '이번 라운드 등수 입력' },
  { key: 'daily', label: '일별', description: '선택 날짜 성적과 기록' },
  { key: 'all', label: '전체', description: '전체 및 개인 통계' },
  { key: 'nanikiru', label: '나니키루', description: '오늘의 마작 문제' },
];

/** 네 메뉴가 같은 굵기와 크기를 사용하도록 전용 SVG 아이콘을 제공합니다. */
function TabIcon({ tab }: { tab: AppTab }) {
  const commonProps = {
    width: 21,
    height: 21,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (tab === 'record') {
    return (
      <svg {...commonProps}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </svg>
    );
  }

  if (tab === 'daily') {
    return (
      <svg {...commonProps}>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19V3" />
      </svg>
    );
  }

  if (tab === 'all') {
    return (
      <svg {...commonProps}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M9 4v16" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.3 2.3 0 1 1 3.5 2c-.9.5-1.3 1-1.3 2" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/**
 * Material AppBar와 우측 Temporary Navigation Drawer를 함께 관리합니다.
 *
 * Drawer가 열려 있는 동안에는:
 * - 배경 스크롤을 잠급니다.
 * - Escape 키로 닫을 수 있습니다.
 * - Tab 포커스를 Drawer 내부에 유지합니다.
 * - 닫힌 뒤 포커스를 햄버거 버튼으로 돌려보냅니다.
 */
export function AppNavigation({
  currentTab,
  mode,
  selectedDate,
  dateSubLabel,
  onTabChange,
  onToggleColorMode,
  onDateChange,
  onShiftDate,
}: AppNavigationProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      menuButton?.focus();
    };
  }, [isDrawerOpen]);

  const handleTabChange = (nextTab: AppTab) => {
    onTabChange(nextTab);
    setIsDrawerOpen(false);
  };

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;

    // 브라우저별 date input 구현 차이를 흡수합니다. Chromium 계열은
    // showPicker를 사용하고, 지원하지 않는 환경은 기본 click으로 폴백합니다.
    input.focus({ preventScroll: true });
    try {
      if (typeof input.showPicker === 'function') {
        input.showPicker();
        return;
      }
    } catch {
      // 사용자 제스처 정책 등으로 showPicker가 거부되면 기본 동작을 사용합니다.
    }
    input.click();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-jade text-on-jade shadow-[var(--shadow-2)]">
        {/* 모바일 너비에서도 날짜 이동과 메뉴가 한 줄을 유지하도록 App Bar를 단일 Toolbar로 구성합니다. */}
        <div
          aria-label="기록 날짜와 내비게이션"
          className="mx-auto flex h-16 w-full max-w-[720px] items-center gap-0.5 px-2 sm:px-3"
        >
          <button
            type="button"
            aria-label="하루 이전"
            onClick={() => onShiftDate(-1)}
            className="grid size-10 shrink-0 place-items-center rounded-full text-on-jade transition hover:bg-on-jade/10 active:scale-95"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <div className="relative min-w-0 flex-1">
            <button
              type="button"
              aria-label={`날짜 선택, 현재 ${selectedDate || '미선택'}`}
              onClick={openDatePicker}
              className="relative w-full rounded-full px-5 py-1 text-center transition hover:bg-on-jade/10"
            >
              <span className="block text-[16px] font-semibold tabular-nums tracking-tight">
                {selectedDate || '날짜 선택'}
              </span>
              <span className="block text-[11px] font-medium opacity-75">
                {dateSubLabel || '눌러서 날짜 선택'}
              </span>
              <span
                aria-hidden="true"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] opacity-75 sm:right-3"
              >
                ▾
              </span>
            </button>
            <input
              ref={dateInputRef}
              type="date"
              aria-label="날짜 선택"
              value={selectedDate}
              onChange={(event) => onDateChange(event.target.value)}
              className="sr-only"
              tabIndex={-1}
            />
          </div>

          <button
            type="button"
            aria-label="하루 이후"
            onClick={() => onShiftDate(1)}
            className="grid size-10 shrink-0 place-items-center rounded-full text-on-jade transition hover:bg-on-jade/10 active:scale-95"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label="내비게이션 메뉴 열기"
            aria-haspopup="dialog"
            aria-expanded={isDrawerOpen}
            onClick={() => setIsDrawerOpen(true)}
            className="grid size-11 shrink-0 place-items-center rounded-full text-on-jade transition hover:bg-on-jade/10 active:scale-95"
          >
            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-[80]" role="presentation">
          <button
            type="button"
            tabIndex={-1}
            aria-label="내비게이션 메뉴 닫기"
            onClick={() => setIsDrawerOpen(false)}
            className="drawer-backdrop absolute inset-0 cursor-default bg-black/50 backdrop-blur-[1px]"
          />

          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="navigation-drawer-title"
            className="drawer-panel absolute inset-y-0 right-0 flex w-[min(84vw,320px)] flex-col border-l border-border bg-surface text-text shadow-2xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
              <div>
                <h2
                  id="navigation-drawer-title"
                  className="text-[17px] font-semibold"
                >
                  메뉴
                </h2>
                <p className="text-[11px] text-muted">화면을 선택해주세요.</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="내비게이션 메뉴 닫기"
                onClick={() => setIsDrawerOpen(false)}
                className="grid size-10 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-text"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <nav
              aria-label="화면 이동"
              className="flex-1 space-y-1 overflow-y-auto p-3"
            >
              {TAB_ITEMS.map((item) => {
                const active = currentTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => handleTabChange(item.key)}
                    className={`flex min-h-[64px] w-full items-center gap-4 rounded-2xl px-4 text-left transition ${
                      active
                        ? 'bg-jade-soft text-[var(--jade-strong)]'
                        : 'text-text hover:bg-surface-2'
                    }`}
                  >
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-full ${
                        active
                          ? 'bg-jade/15 text-jade-strong'
                          : 'bg-surface-2 text-muted'
                      }`}
                    >
                      <TabIcon tab={item.key} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold">
                        {item.label}
                      </span>
                      <span
                        className={`mt-0.5 block truncate text-[11px] ${
                          active ? 'text-[var(--jade-strong)]/75' : 'text-muted'
                        }`}
                      >
                        {item.description}
                      </span>
                    </span>
                    {active && (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* 색상 모드는 화면 이동이 아닌 앱 설정이므로 메뉴 목록과 분리합니다. */}
            <div className="shrink-0 border-t border-border p-3">
              <button
                type="button"
                role="switch"
                aria-checked={mode === 'dark'}
                onClick={onToggleColorMode}
                className="flex min-h-[60px] w-full items-center gap-4 rounded-2xl px-4 text-left text-text transition hover:bg-surface-2"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-muted">
                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">
                    다크 모드
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted">
                    현재 {mode === 'dark' ? '켜짐' : '꺼짐'}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                    mode === 'dark' ? 'bg-jade' : 'bg-border'
                  }`}
                >
                  <span
                    className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform ${
                      mode === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
