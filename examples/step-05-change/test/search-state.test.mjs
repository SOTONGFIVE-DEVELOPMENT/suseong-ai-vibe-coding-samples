import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { criteriaFromSearch, searchUrl, telephoneHref } from '../lib/search-state.mjs';
import { filterRecords, browseRecords } from '../lib/filter.mjs';
const seed = JSON.parse(await readFile(new URL('../data/records.seed.json', import.meta.url)));

test('세 조건 AND·0건·초기화와 전화번호 링크', () => {
  const criteria = { query: '사월', region: '대구 수성구', type: '작은도서관' };
  const items = filterRecords(seed.items, criteria);
  assert.equal(items.length, 1);
  assert.equal(telephoneHref(items[0].phone), 'tel:0536681940');
  assert.equal(filterRecords(seed.items, { ...criteria, region: '대구 중구' }).length, 0);
  assert.equal(filterRecords(seed.items, criteriaFromSearch('')).length, 3);
  assert.equal(telephoneHref(''), null);
  assert.equal(telephoneHref(null), null);
  assert.equal(telephoneHref('javascript:alert(1)'), null);
  assert.equal(telephoneHref('+82 (53) 668-1940'), 'tel:+82536681940');
});

test('한글 조건 URL을 다시 읽으면 입력·결과 복원, 초기화는 관련 조건만 제거', () => {
  const first = { query: ' 사월 ', region: '대구 수성구', type: '작은도서관' };
  const one = searchUrl('http://127.0.0.1:3000/?view=table#results', first);
  const restored = criteriaFromSearch(new URL(one, 'http://127.0.0.1:3000').search);
  assert.deepEqual(restored, { ...first, query: '사월' });
  assert.equal(filterRecords(seed.items, restored).length, 1);
  const zero = searchUrl(new URL(one, 'http://127.0.0.1:3000').href, { ...restored, region: '대구 중구' });
  assert.equal(filterRecords(seed.items, criteriaFromSearch(new URL(zero, 'http://127.0.0.1:3000').search)).length, 0);
  // 브라우저의 뒤로·앞으로가 읽는 각 주소에서도 같은 조건·결과가 재현됩니다.
  for (const [url, count] of [[one, 1], [zero, 0], [one, 1], [zero, 0]]) {
    assert.equal(filterRecords(seed.items, criteriaFromSearch(new URL(url, 'http://127.0.0.1:3000').search)).length, count);
  }
  const reset = searchUrl(new URL(zero, 'http://127.0.0.1:3000').href, {});
  assert.equal(reset, '/?view=table#results');
  assert.equal(filterRecords(seed.items, criteriaFromSearch(new URL(reset, 'http://127.0.0.1:3000').search)).length, 3);
});

test('0건 첫 조회도 전체 지역·유형과 결과/전체 건수를 돌려준다', () => {
  const result = browseRecords(seed, criteriaFromSearch('?q=사월&region=대구%20중구&type=작은도서관'));
  assert.equal(result.count, 0);
  assert.equal(result.meta.totalCount, 3);
  assert.deepEqual(result.facets.regions, ['대구 수성구', '대구 중구']);
  assert.deepEqual(result.facets.types, ['공공도서관', '작은도서관']);
});
