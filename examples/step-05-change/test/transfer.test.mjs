import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readStore, validateStore } from '../lib/store.mjs';
import { describeData } from '../lib/provenance.mjs';
import { prepareTransfer } from '../scripts/prepare-transfer.mjs';
const syntheticText = await readFile(new URL('../data/records.synthetic.json', import.meta.url), 'utf8');
const synthetic = JSON.parse(syntheticText);
const recordedText = await readFile(new URL('../data/records.seed.json', import.meta.url), 'utf8');
const recorded = JSON.parse(recordedText);

test('가상 자료는 sample 읽기와 독립된 자료 종류이고 실제 기관 메타를 거부', () => {
  const data = validateStore(synthetic);
  assert.equal(data.meta.dataMode, 'sample');
  assert.equal(data.meta.dataKind, 'synthetic');
  for (const field of ['syncedAt', 'recordedAt', 'upstreamTotalCount', 'originalResponseSha256']) {
    assert.equal(data.meta[field], null);
    const mixed = structuredClone(synthetic);
    mixed.meta[field] = field === 'syncedAt' ? recorded.meta.recordedAt : recorded.meta[field];
    assert.throws(() => validateStore(mixed));
  }
  const mixedSource = structuredClone(synthetic); mixedSource.meta.source = recorded.meta.source;
  assert.throws(() => validateStore(mixedSource));
  const mixedMode = structuredClone(synthetic); mixedMode.meta.dataMode = 'live';
  assert.throws(() => validateStore(mixedMode));
});

test('화면 설명은 가상 목록에 기관 수집 이력을 표시하지 않고 실제 재생·live를 구분', () => {
  const view = describeData(validateStore(synthetic).meta);
  assert.equal(view.title, '가상 업무 목록 조회');
  assert.match(view.badge, /가상.*외부 호출 없음/);
  assert.ok(view.details.some(([label]) => label === '직접 기관 API 호출'));
  assert.ok(!view.details.some(([label]) => ['원본 수집 시각', 'API 원본 전체', '수집·저장 시각', '이 PC 재생·저장 시각'].includes(label)));
  const visible = JSON.stringify(view);
  assert.ok(!visible.includes(recorded.meta.recordedAt));
  assert.ok(!visible.includes(recorded.meta.originalResponseSha256));
  assert.ok(!visible.includes('242'));
  assert.ok(!visible.includes('공공데이터포털'));
  assert.match(describeData(recorded.meta).badge, /실제 저장 예제.*sample/);
  assert.match(describeData({ ...recorded.meta, dataMode: 'live', dataKind: 'live' }).badge, /실제 API 응답.*live/);
});

test('전이 준비는 별도 복사본 표시 없이는 쓰지 않고 반복 실행에도 이전 파일을 백업', async () => {
  const folder = await mkdtemp(path.join(os.tmpdir(), 'suseong-transfer-'));
  const file = path.join(folder, 'data', 'records.json');
  try {
    await mkdir(path.join(folder, 'data'));
    await writeFile(file, recordedText);
    await writeFile(path.join(folder, 'data', 'records.synthetic.json'), syntheticText);
    await assert.rejects(prepareTransfer({ folder }), /별도 폴더/);
    assert.equal(await readFile(file, 'utf8'), recordedText);
    const first = await prepareTransfer({ folder, confirmCopy: true });
    assert.equal(await readFile(first.backup, 'utf8'), recordedText);
    assert.equal((await readStore(file)).meta.dataKind, 'synthetic');
    const edited = JSON.parse(await readFile(file, 'utf8')); edited.items[0].name = '가상 행사 A';
    await writeFile(file, JSON.stringify(edited));
    const second = await prepareTransfer({ folder, confirmCopy: true });
    assert.notEqual(second.backup, first.backup);
    assert.equal(JSON.parse(await readFile(second.backup, 'utf8')).items[0].name, '가상 행사 A');
    assert.equal((await readStore(file)).items[0].name, '가상 시설 A');
    assert.equal(await readFile(new URL('../data/records.seed.json', import.meta.url), 'utf8'), recordedText);
  } finally { await rm(folder, { recursive: true, force: true }); }
});

test('잘못된 가상 fixture를 거부해 기존 파일을 보존', async () => {
  const folder = await mkdtemp(path.join(os.tmpdir(), 'suseong-transfer-'));
  try {
    await mkdir(path.join(folder, 'data'));
    const file = path.join(folder, 'data', 'records.json');
    await writeFile(file, recordedText);
    await writeFile(path.join(folder, 'data', 'records.synthetic.json'), recordedText);
    await assert.rejects(prepareTransfer({ folder, confirmCopy: true }), /가상 전이/);
    assert.equal(await readFile(file, 'utf8'), recordedText);
  } finally { await rm(folder, { recursive: true, force: true }); }
});

// 파일 조회 전·조회 실패·잘못된 종류는 자료 출처 설명 자체를 만들지 않습니다.
// API 영역은 확인된 설명이 있을 때만 표시하므로 가상 파일 편집 오류도
// 실제 자료 가져오기를 선택할 수 있는 상태로 바뀌지 않습니다.
test('조회 미확인과 잘못된 자료 종류에는 화면 설명을 만들지 않음', async () => {
  for (const meta of [null, undefined, {}, { dataMode: 'unknown' },
    { ...synthetic.meta, dataKind: 'unknown' },
    { ...synthetic.meta, dataMode: 'live' },
    { ...recorded.meta, dataKind: 'live' }]) {
    assert.equal(describeData(meta), null);
  }
  assert.equal(describeData(recorded.meta).kind, 'recorded');
  assert.equal(describeData(synthetic.meta).kind, 'synthetic');
  const folder = await mkdtemp(path.join(os.tmpdir(), 'suseong-invalid-query-'));
  try {
    const file = path.join(folder, 'records.json');
    const invalid = '{"meta":{"dataKind":"synthetic"},';
    await writeFile(file, invalid);
    await assert.rejects(readStore(file), SyntaxError);
    assert.equal(await readFile(file, 'utf8'), invalid);
  } finally { await rm(folder, { recursive: true, force: true }); }
});
