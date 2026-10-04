import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseFinalFilters, finalLibraryResponse } from '../lib/final-response.mjs';
import { readStore } from '../lib/store.mjs';
import { importRecords } from '../lib/api-source.mjs';
import { GET as health } from '../app/api/health/route.js';
const seed = await readStore(new URL('../data/records.seed.json', import.meta.url));
const responseFor = search => finalLibraryResponse(seed, parseFinalFilters(new URL(`http://127.0.0.1:3000/${search}`)));

test('최종 화면 계약: 이름·지역·유형을 URL로 복원한 AND 검색과 초기화', () => {
  assert.equal(responseFor('').matchedCount, 3);
  const found = responseFor('?name=%20사월%20&region=대구%20수성구&type=작은도서관');
  assert.equal(found.matchedCount, 1);
  assert.equal(found.items[0].name, '수성구립사월책문화센터도서관');
  assert.equal(responseFor('?name=사월&region=대구%20중구&type=작은도서관').matchedCount, 0);
  assert.equal(responseFor('?name=없는도서관').matchedCount, 0);
  assert.equal(responseFor('').matchedCount, 3);
});

test('0건 검색 뒤에도 전체 지역·유형 선택지와 실제 총 건수를 유지', () => {
  const empty = responseFor('?name=없는도서관');
  assert.deepEqual(empty.facets, responseFor('').facets);
  assert.deepEqual(new Set(empty.facets.regions), new Set(['대구 수성구', '대구 중구']));
  assert.deepEqual(new Set(empty.facets.types), new Set(['공공도서관', '작은도서관']));
  assert.equal(empty.meta.totalCount, 3);
  assert.equal(empty.items.length, empty.matchedCount);
});

test('검색 응답에 전화·기관 기준일과 출처·시각·원본 건수를 보존', () => {
  const result = responseFor('?name=사월');
  assert.deepEqual(result.meta, seed.meta);
  assert.equal(result.items[0].phone, '053-668-1940');
  assert.equal(result.items[0].address, '대구광역시 수성구 성동로 70(청운신협행복센터 2층)');
  assert.equal(result.items[0].referenceDate, '2026-03-01');
  assert.equal(result.meta.syncedAt, null);
  assert.equal(result.meta.recordedAt, '2026-10-04T10:17:37Z');
  assert.equal(result.meta.upstreamTotalCount, 242);
});

test('최종 URL 계약에서 중복·과도한 길이·제어문자·알 수 없는 조건 거부', () => {
  for (const search of ['?name=a&name=b', '?other=a', '?name=%00', `?name=${'a'.repeat(101)}`]) {
    assert.throws(() => responseFor(search));
  }
});

test('동일 최종 저장소에서 키 없이 재생·저장하고 모의 실패는 이전 성공 자료 보존', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'suseong-final-'));
  const file = path.join(dir, 'records.json');
  try {
    const data = await importRecords({ mode: 'sample', file, fixtureFile: new URL('../data/sample-api-response.json', import.meta.url), fetchFn: () => { throw new Error('sample은 외부 접속하지 않습니다.'); } });
    assert.equal(data.meta.dataMode, 'sample');
    assert.equal(data.meta.recordedAt, seed.meta.recordedAt);
    assert.equal(data.meta.upstreamTotalCount, 242);
    assert.ok(Number.isFinite(Date.parse(data.meta.syncedAt)));
    const before = await readFile(file, 'utf8');
    for (const exercise of ['auth', 'timeout', 'malformed']) {
      await assert.rejects(importRecords({ mode: 'sample', exercise, file }));
      assert.equal(await readFile(file, 'utf8'), before);
    }
    const reloaded = await readStore(file);
    assert.equal(finalLibraryResponse(reloaded, { name: '사월', region: '대구 수성구', type: '작은도서관' }).matchedCount, 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('연결 상태는 키 설정 여부만 공개하고 값은 반환하지 않음', async () => {
  const before = process.env.DATA_GO_KR_SERVICE_KEY;
  try {
    delete process.env.DATA_GO_KR_SERVICE_KEY;
    assert.equal((await health().json()).apiConfigured, false);
    process.env.DATA_GO_KR_SERVICE_KEY = 'test-only-not-a-real-key';
    const response = health();
    const text = await response.text();
    assert.equal(JSON.parse(text).apiConfigured, true);
    assert.equal(text.includes('test-only-not-a-real-key'), false);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  } finally {
    if (before === undefined) delete process.env.DATA_GO_KR_SERVICE_KEY;
    else process.env.DATA_GO_KR_SERVICE_KEY = before;
  }
});
