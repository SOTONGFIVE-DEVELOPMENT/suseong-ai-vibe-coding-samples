import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { importRecords, fetchLive, normalizePage, OFFICIAL_ENDPOINT } from '../lib/api-source.mjs';
import { readStore, saveStore } from '../lib/store.mjs';
import { allowLocalWrite } from '../lib/local-request.mjs';
const fixtureFile = new URL('../data/sample-api-response.json', import.meta.url);
const payload = JSON.parse(await readFile(fixtureFile));
function response(body) { return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } }); }
test('가상 API 자료를 명시적인 sample 출처로 저장하며 오류는 정상 파일 보존', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'suseong-import-'));
  const file = path.join(dir, 'records.json');
  try {
    await importRecords({ mode: 'sample', fixtureFile, file });
    const stored = await readStore(file);
    assert.equal(stored.items.length, 3);
    assert.equal(stored.meta.dataMode, 'sample');
    assert.match(stored.meta.source, /교육용 API 응답/);
    assert.ok(stored.meta.syncedAt);
    const before = await readFile(file, 'utf8');
    for (const exercise of ['timeout', 'malformed', 'auth']) {
      await assert.rejects(importRecords({ mode: 'sample', exercise, fixtureFile, file }));
      assert.equal(await readFile(file, 'utf8'), before);
    }
    const badFile = path.join(dir, 'bad.json');
    await import('node:fs/promises').then(fs => fs.writeFile(badFile, JSON.stringify({ response: { header: { resultCode: '30' } } })));
    await assert.rejects(importRecords({ mode: 'sample', fixtureFile: badFile, file }));
    assert.equal(await readFile(file, 'utf8'), before);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('인증·형식·지역 오류와 누락 필수 필드를 거부', () => {
  const broken = structuredClone(payload); broken.response.header.resultCode = '30';
  assert.throws(() => normalizePage(broken));
  const noName = structuredClone(payload); delete noName.response.body.items[0].lbrryNm;
  assert.throws(() => normalizePage(noName));
  const wrongCity = structuredClone(payload); wrongCity.response.body.items[0].ctprvnNm = '서울특별시';
  assert.throws(() => normalizePage(wrongCity));
  assert.throws(() => normalizePage({ unrelated: payload.response.body.items }));
  const missingCount = structuredClone(payload); missingCount.response.body.totalCount = null;
  assert.throws(() => normalizePage(missingCount));
  const wrongDate = structuredClone(payload); wrongDate.response.body.items[0].referenceDate = '2026-02-31';
  assert.throws(() => normalizePage(wrongDate));
});
test('실전 어댑터는 고정 공식 endpoint·페이지0부터 전체 페이지 수집 (모의 서버)', async () => {
  const calls = [];
  const data = await fetchLive({ serviceKey: 'test-only-not-a-real-key', fetchFn: async (url, options) => {
    calls.push(new URL(url));
    assert.equal(options.redirect, 'error');
    const page = Number(url.searchParams.get('pageNo'));
    const part = structuredClone(payload); part.response.body.items = payload.response.body.items.slice(page, page + 1);
    return response(part);
  } });
  assert.equal(calls.length, 3);
  assert.equal(`${calls[0].origin}${calls[0].pathname}`, OFFICIAL_ENDPOINT);
  assert.equal(calls[0].searchParams.get('CTPRVN_NM'), '대구광역시');
  assert.equal(calls[0].searchParams.get('pageNo'), '0');
  assert.equal(data.meta.dataMode, 'live');
  assert.equal(data.items.length, 3);
});
test('페이지 반복·건수 변경·HTML 오류·시간 초과에서 실전 갱신을 거부', async () => {
  await assert.rejects(fetchLive({ serviceKey: 'test-only', fetchFn: async () => response({ response: { ...payload.response, body: { ...payload.response.body, items: [payload.response.body.items[0]] } } }) }));
  await assert.rejects(fetchLive({ serviceKey: 'test-only', fetchFn: async () => new Response('<html>error</html>', { headers: { 'Content-Type': 'text/html' } }) }));
  await assert.rejects(fetchLive({ serviceKey: 'test-only', fetchFn: async () => { throw new Error('timeout'); } }));
  let count = 0;
  await assert.rejects(fetchLive({ serviceKey: 'test-only', fetchFn: async () => {
    const value = structuredClone(payload); value.response.body.totalCount = ++count === 1 ? 3 : 4; value.response.body.items = [payload.response.body.items[count - 1]]; return response(value);
  } }));
  await assert.rejects(fetchLive({ serviceKey: '' }));
});
test('브라우저의 동일 local origin만 쓰기 허용', () => {
  const make = (origin, host = '127.0.0.1:3000', fetchSite = 'same-origin') => new Request('http://127.0.0.1:3000/api/import', { method: 'POST', headers: { Host: host, Origin: origin, 'Content-Type': 'application/json', 'Sec-Fetch-Site': fetchSite }, body: '{}' });
  assert.equal(allowLocalWrite(make('http://127.0.0.1:3000')), true);
  const nextSynthetic = new Request('http://localhost:3000/api/import', { method: 'POST', headers: { Host: '127.0.0.1:3000', Origin: 'http://127.0.0.1:3000', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(allowLocalWrite(nextSynthetic), true);
  assert.equal(allowLocalWrite(make('https://attacker.example')), false);
  assert.equal(allowLocalWrite(make('http://127.0.0.1:3000', 'attacker.example')), false);
  assert.equal(allowLocalWrite(make('http://127.0.0.1:3000', '127.0.0.1:3000', 'cross-site')), false);
});
