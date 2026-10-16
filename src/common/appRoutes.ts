/**
 * 앱에서 지원하는 네 화면과 공개 URL을 한 곳에서 관리합니다.
 * API 주소(/api/...)와 충돌하지 않는 경로만 사용합니다.
 */
export type AppTab = 'record' | 'daily' | 'all' | 'nanikiru';

export const APP_TAB_PATHS: Record<AppTab, string> = {
  record: '/record',
  daily: '/daily',
  all: '/all',
  nanikiru: '/nanikiru',
};

/** 현재 브라우저 주소에 해당하는 탭입니다. 알 수 없는 경로는 기록 탭으로 처리합니다. */
export function tabFromPath(pathname: string): AppTab {
  if (pathname === APP_TAB_PATHS.daily) return 'daily';
  if (pathname === APP_TAB_PATHS.all) return 'all';
  if (pathname === APP_TAB_PATHS.nanikiru) return 'nanikiru';
  return 'record';
}

/**
 * 공유 링크의 date 쿼리를 실제로 존재하는 YYYY-MM-DD 날짜인지 검사합니다.
 * new Date(2026, 1, 31)처럼 잘못된 날이 다음 달로 넘어가는 것을 허용하지 않습니다.
 * UTC 파싱은 검증에만 사용하며 앱의 오늘 날짜는 계속 서버(Asia/Seoul)가 결정합니다.
 */
export function parseSharedDate(value: string | null): string | null {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10) === value ? value : null;
}

/**
 * Drawer에서 탭을 클릭할 때 이동할 주소를 만듭니다.
 * 일별 탭만 날짜를 공유해야 하므로 다른 화면에는 date 쿼리를 붙이지 않습니다.
 */
export function tabUrl(tab: AppTab, selectedDate: string): string {
  const path = APP_TAB_PATHS[tab];
  const validDate = parseSharedDate(selectedDate);
  return tab === 'daily' && validDate ? `${path}?date=${validDate}` : path;
}
