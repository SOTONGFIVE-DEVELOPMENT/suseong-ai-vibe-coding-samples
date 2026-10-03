import test from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../app/api/libraries/route.js';
import { filterRecords } from '../lib/filter.mjs';

test('API 이름 검색의 건수·항목·전체 건수와 공백 처리', async () => {
  for (const [query, count] of [['', 3], ['도서관 B', 1], [' 도서관 B ', 1], ['없는도서관', 0], ['   ', 3], ['', 3]]) {
    const url = new URL('http://localhost/api/libraries');
    url.searchParams.set('q', query);
    const response = await GET(new Request(url));
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.count, count, `검색어: ${JSON.stringify(query)}`);
    assert.equal(data.items.length, count);
    assert.equal(data.meta.totalCount, 3);
    if (count === 1) assert.equal(data.items[0].name, '도서관 B');
  }
});

test('화면에서 사용하는 필터가 API 전체 자료에서 검색·초기화 결과를 반환', async () => {
  const data = await (await GET(new Request('http://localhost/api/libraries'))).json();
  assert.deepEqual(filterRecords(data.items, { query: ' 도서관 B ' }).map(item => item.name), ['도서관 B']);
  assert.deepEqual(filterRecords(data.items, { query: '없는도서관' }), []);
  assert.deepEqual(filterRecords(data.items, { query: '   ' }), data.items);
  assert.deepEqual(filterRecords(data.items, { query: '' }), data.items);
});
