import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

export const DEFAULT_FILE = path.join(process.cwd(), 'data', 'records.json');
export function validateStore(value) {
  if (!value || !value.meta || !['sample', 'live'].includes(value.meta.dataMode) || !Array.isArray(value.items) || value.items.length > 10000) throw new Error('저장 파일의 자료 형식을 확인하세요.');
  const seen = new Set();
  const items = value.items.map(item => {
    if (!item || typeof item !== 'object') throw new Error('목록 항목 형식을 확인하세요.');
    for (const key of ['id', 'name', 'region', 'type']) {
      if (typeof item[key] !== 'string' || !item[key].trim() || item[key].length > 200) throw new Error('목록의 필수 값이 없거나 너무 깁니다.');
    }
    if (seen.has(item.id)) throw new Error('중복된 항목 ID가 있습니다.');
    seen.add(item.id);
    for (const key of ['address', 'phone', 'referenceDate']) {
      if (item[key] != null && (typeof item[key] !== 'string' || item[key].length > 500)) throw new Error('목록의 선택 값 형식을 확인하세요.');
    }
    return { id: item.id, name: item.name, region: item.region, type: item.type, address: item.address ?? '', phone: item.phone ?? '', referenceDate: item.referenceDate ?? null };
  });
  for (const key of ['source', 'scope']) if (typeof value.meta[key] !== 'string' || value.meta[key].length > 1000) throw new Error('자료 출처와 범위를 확인하세요.');
  if (value.meta.syncedAt !== null && (typeof value.meta.syncedAt !== 'string' || !Number.isFinite(Date.parse(value.meta.syncedAt)))) throw new Error('동기화 일시 형식을 확인하세요.');
  if (!Number.isInteger(value.meta.totalCount) || value.meta.totalCount !== items.length) throw new Error('자료 건수와 실제 목록이 다릅니다.');
  const recordedAt = value.meta.recordedAt ?? null;
  const upstreamTotalCount = value.meta.upstreamTotalCount ?? null;
  const originalResponseSha256 = value.meta.originalResponseSha256 ?? null;
  if (recordedAt !== null && (typeof recordedAt !== 'string' || !Number.isFinite(Date.parse(recordedAt)))) throw new Error('원본 수집 일시 형식을 확인하세요.');
  if (upstreamTotalCount !== null && (!Number.isInteger(upstreamTotalCount) || upstreamTotalCount < items.length)) throw new Error('원본 전체 건수를 확인하세요.');
  if (originalResponseSha256 !== null && (typeof originalResponseSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(originalResponseSha256))) throw new Error('원본 응답 지문 형식을 확인하세요.');
  return { meta: { dataMode: value.meta.dataMode, source: value.meta.source, syncedAt: value.meta.syncedAt, scope: value.meta.scope, totalCount: items.length, recordedAt, upstreamTotalCount, originalResponseSha256 }, items };
}
export async function readStore(file = DEFAULT_FILE) {
  const raw = await readFile(file, 'utf8');
  if (raw.length > 4000000) throw new Error('저장 파일이 너무 큽니다.');
  return validateStore(JSON.parse(raw));
}
// 검증·임시 파일 쓰기가 성공해야 기존 정상 파일을 원자적으로 교체합니다.
export async function saveStore(value, file = DEFAULT_FILE) {
  const data = validateStore(value);
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    await rename(temporary, file);
  } finally { await unlink(temporary).catch(() => {}); }
  return data;
}
