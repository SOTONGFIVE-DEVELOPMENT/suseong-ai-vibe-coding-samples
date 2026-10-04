import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('교육용 정상본의 단계·자료 계약', async () => {
  const stage = JSON.parse(await readFile(new URL('../stage.json', import.meta.url)));
  const data = JSON.parse(await readFile(new URL('../data/records.seed.json', import.meta.url)));
  assert.ok(stage.success.length >= 2);
  assert.equal(data.items.length, 3);
  assert.equal(data.items.filter(r => r.region === '대구 수성구').length, 2);
  assert.equal(data.meta.dataMode, 'sample');
  assert.deepEqual(data.items.map(item => item.name), ['수성구립용학도서관', '수성구립사월책문화센터도서관', '2.28민주운동 기념회관']);
  assert.deepEqual(data.items.map(item => [item.address, item.phone, item.referenceDate]), [
    ['대구광역시 수성구 지범로41길 36(범물동)', '053-668-1700', '2026-03-01'],
    ['대구광역시 수성구 성동로 70(청운신협행복센터 2층)', '053-668-1940', '2026-03-01'],
    ['대구광역시 중구 2·28길 9', '053-257-2280', '2025-12-29'],
  ]);
  assert.equal(data.meta.recordedAt, '2026-10-04T10:17:37Z');
  assert.equal(data.meta.syncedAt, null);
  assert.equal(data.meta.upstreamTotalCount, 242);
  assert.match(data.meta.originalResponseSha256, /^[a-f0-9]{64}$/);
});
