import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('교육용 정상본의 단계·자료 계약', async () => {
  const stage = JSON.parse(await readFile(new URL('../stage.json', import.meta.url)));
  const data = JSON.parse(await readFile(new URL('../data/records.json', import.meta.url)));
  assert.ok(stage.success.length >= 2);
  assert.equal(data.items.length, 3);
  assert.equal(data.items.filter(r => r.region === '대구 수성구').length, 2);
  assert.equal(data.meta.dataMode, 'sample');
  assert.equal(data.items[1].address, '');
});
