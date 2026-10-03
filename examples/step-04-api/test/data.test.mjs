import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readStore, saveStore } from '../lib/store.mjs';
import { filterRecords, displayValue } from '../lib/filter.mjs';
const seed = JSON.parse(await readFile(new URL('../data/records.json', import.meta.url)));
test('파일 자료를 읽고 이름 검색 3→1→0→3', async () => {
  const data = await readStore(new URL('../data/records.json', import.meta.url));
  assert.equal(filterRecords(data.items).length, 3);
  assert.equal(filterRecords(data.items, { query: ' 도서관 B ' }).length, 1);
  assert.equal(filterRecords(data.items, { query: '없는도서관' }).length, 0);
  assert.equal(filterRecords(data.items, { query: '' }).length, 3);
});
test('지역·유형을 AND 결합하고 누락 값을 표시', () => {
  assert.equal(filterRecords(seed.items, { region: '대구 수성구' }).length, 2);
  assert.equal(filterRecords(seed.items, { region: '대구 중구' }).length, 1);
  assert.equal(filterRecords(seed.items, { region: '대구 수성구', type: '작은도서관' })[0].name, '도서관 B');
  assert.equal(displayValue(''), '정보 없음');
  assert.equal(displayValue(null), '정보 없음');
});
test('저장 후 새로 읽어도 변경 유지, 잘못된 갱신은 정상 파일 보존', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'suseong-store-'));
  const file = path.join(dir, 'records.json');
  try {
    const changed = structuredClone(seed); changed.items[0].name = '도서관 A 실습';
    await saveStore(changed, file);
    assert.equal((await readStore(file)).items[0].name, '도서관 A 실습');
    const before = await readFile(file, 'utf8');
    const broken = structuredClone(changed); broken.items[0].name = '';
    await assert.rejects(saveStore(broken, file));
    assert.equal(await readFile(file, 'utf8'), before);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
