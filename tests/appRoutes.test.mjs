/**
 * 화면 URL과 날짜 검증 로직을 React 없이 독립 검증하는 테스트.
 * `npm run test:routes`가 순수 TS 함수를 컴파일한 후 이 테스트를 실행합니다.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APP_TAB_PATHS, tabFromPath, parseSharedDate, tabUrl } from '../.routing-test-build/appRoutes.js';

test('네 탭의 공유 URL은 서로 다르고 일관적이다', () => {
  assert.deepEqual(APP_TAB_PATHS, {
    record: '/record', daily: '/daily', all: '/all', nanikiru: '/nanikiru',
  });
  for (const [tab, path] of Object.entries(APP_TAB_PATHS)) {
    assert.equal(tabFromPath(path), tab);
  }
  assert.equal(tabFromPath('/unknown'), 'record');
});

test('일별 URL에만 선택된 날짜가 포함된다', () => {
  assert.equal(tabUrl('daily', '2026-10-08'), '/daily?date=2026-10-08');
  assert.equal(tabUrl('record', '2026-10-08'), '/record');
  assert.equal(tabUrl('all', '2026-10-08'), '/all');
  assert.equal(tabUrl('nanikiru', '2026-10-08'), '/nanikiru');
  assert.equal(tabUrl('daily', ''), '/daily');
});

test('공유 날짜는 실제로 존재하는 ISO 날짜만 허용한다', () => {
  assert.equal(parseSharedDate('2024-02-29'), '2024-02-29');
  assert.equal(parseSharedDate('2026-02-29'), null);
  assert.equal(parseSharedDate('2026-02-31'), null);
  assert.equal(parseSharedDate('2026-13-01'), null);
  assert.equal(parseSharedDate('2026-00-01'), null);
  assert.equal(parseSharedDate('2026-1-01'), null);
  assert.equal(parseSharedDate('abc'), null);
  assert.equal(parseSharedDate(null), null);
});
