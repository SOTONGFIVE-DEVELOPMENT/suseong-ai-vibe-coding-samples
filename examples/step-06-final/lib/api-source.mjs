import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { saveStore } from './store.mjs';

export const OFFICIAL_ENDPOINT = 'https://api.data.go.kr/openapi/tn_pubr_public_lbrry_api';
const PAGE_SIZE = 500;
const MAX_ITEMS = 10000;
const LIMIT_BYTES = 2000000;
const MESSAGE = 'API 자료를 가져오지 못했습니다. 키 승인·연결·응답 형식을 확인하세요. 기존 저장 파일은 유지됩니다.';
function field(item, camel, official, required = false) {
  const value = item[camel] ?? item[official] ?? '';
  if (typeof value !== 'string' || value.length > 500 || (required && !value.trim())) throw new Error(MESSAGE);
  return value.trim();
}
export function normalizePage(payload) {
  // The authenticated API may return header/body directly; older saved responses
  // may wrap the same explicit shape in response. Do not search arbitrary arrays.
  const response = payload?.response ?? payload;
  if (!response || String(response.header?.resultCode) !== '00') throw new Error(MESSAGE);
  const body = response.body;
  const rawTotal = body?.totalCount;
  if (!['number', 'string'].includes(typeof rawTotal) || (typeof rawTotal === 'string' && !/^\d+$/.test(rawTotal))) throw new Error(MESSAGE);
  const totalCount = Number(rawTotal);
  if (!Number.isInteger(totalCount) || totalCount < 0 || totalCount > MAX_ITEMS) throw new Error(MESSAGE);
  // 두 직렬화 표현만 허용합니다. 임의의 배열을 찾아 쓰지 않습니다.
  const raw = Array.isArray(body?.items) ? body.items : body?.items?.item;
  const items = raw == null && totalCount === 0 ? [] : raw;
  if (!Array.isArray(items) || items.length > PAGE_SIZE) throw new Error(MESSAGE);
  const mapped = items.map(item => {
    if (!item || typeof item !== 'object') throw new Error(MESSAGE);
    const name = field(item, 'lbrryNm', 'LBRRY_NM', true);
    const city = field(item, 'ctprvnNm', 'CTPRVN_NM', true);
    const district = field(item, 'signguNm', 'SIGNGU_NM', true);
    if (city !== '대구광역시') throw new Error(MESSAGE);
    const type = field(item, 'lbrrySe', 'LBRRY_SE', true);
    const address = field(item, 'rdnmadr', 'RDNMADR');
    const referenceDate = field(item, 'referenceDate', 'REFERENCE_DATE');
    if (referenceDate && (!/^\d{4}-\d{2}-\d{2}$/.test(referenceDate) || !Number.isFinite(Date.parse(referenceDate)) || new Date(referenceDate).toISOString().slice(0, 10) !== referenceDate)) throw new Error(MESSAGE);
    return { id: createHash('sha256').update(`${city}|${district}|${name}|${address}`).digest('hex').slice(0, 20), name, region: `대구 ${district}`, type, address, phone: field(item, 'phoneNumber', 'PHONE_NUMBER'), referenceDate: referenceDate || null };
  });
  return { totalCount, items: mapped };
}
async function readBoundedJson(response) {
  if (!response.ok || !response.headers.get('content-type')?.includes('json')) throw new Error(MESSAGE);
  if (Number(response.headers.get('content-length')) > LIMIT_BYTES) throw new Error(MESSAGE);
  const reader = response.body?.getReader();
  if (!reader) throw new Error(MESSAGE);
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > LIMIT_BYTES) throw new Error(MESSAGE);
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const combined = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(combined));
}
export async function fetchLive({ serviceKey, fetchFn = fetch, deadlineMs = 25000 } = {}) {
  if (!serviceKey || typeof serviceKey !== 'string' || serviceKey.length > 1000) throw new Error(MESSAGE);
  const all = [];
  const seenPages = new Set();
  let expectedTotal = null;
  const deadline = AbortSignal.timeout(deadlineMs);
  // 명세의 첫 페이지는 0입니다. 전체 페이지 검증 후에만 저장합니다.
  for (let pageNo = 0; pageNo < 20; pageNo++) {
    const url = new URL(OFFICIAL_ENDPOINT);
    url.search = new URLSearchParams({ serviceKey, pageNo: String(pageNo), numOfRows: String(PAGE_SIZE), type: 'json', CTPRVN_NM: '대구광역시' }).toString();
    let page;
    try {
      const response = await fetchFn(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.any([deadline, AbortSignal.timeout(8000)]), headers: { Accept: 'application/json' } });
      page = normalizePage(await readBoundedJson(response));
    } catch { throw new Error(MESSAGE); }
    if (expectedTotal === null) expectedTotal = page.totalCount;
    if (expectedTotal !== page.totalCount || (page.items.length === 0 && all.length < expectedTotal)) throw new Error(MESSAGE);
    const pageFingerprint = JSON.stringify(page.items);
    if (page.items.length && seenPages.has(pageFingerprint)) throw new Error(MESSAGE);
    seenPages.add(pageFingerprint);
    all.push(...page.items);
    if (all.length > expectedTotal) throw new Error(MESSAGE);
    if (all.length === expectedTotal) {
      // Check the advertised raw count before removing exact duplicate records.
      // A shared ID with different normalized fields is an unsafe collision.
      const unique = new Map();
      for (const item of all) {
        const previous = unique.get(item.id);
        if (previous && JSON.stringify(previous) !== JSON.stringify(item)) throw new Error(MESSAGE);
        unique.set(item.id, item);
      }
      const items = [...unique.values()];
      return { items, meta: { dataMode: 'live', source: '공공데이터포털 전국도서관표준데이터 (15013109)', syncedAt: new Date().toISOString(), scope: '대구광역시 조건으로 조회한 API 응답 전체 페이지 · 동일 자료 중복 제거', totalCount: items.length, upstreamTotalCount: expectedTotal } };
    }
  }
  throw new Error(MESSAGE);
}
export async function importRecords({ mode = process.env.DATA_MODE ?? 'sample', serviceKey = process.env.DATA_GO_KR_SERVICE_KEY, exercise = 'success', file, fixtureFile = path.join(process.cwd(), 'data', 'sample-api-response.json'), fetchFn } = {}) {
  if (!['sample', 'live'].includes(mode) || !['success', 'timeout', 'malformed', 'auth'].includes(exercise)) throw new Error(MESSAGE);
  let data;
  if (mode === 'sample') {
    if (exercise !== 'success') throw new Error(`교육용 ${exercise === 'timeout' ? '시간 초과' : exercise === 'auth' ? '인증 오류' : '응답 형식 오류'}를 재현했습니다. 기존 저장 파일은 유지됩니다.`);
    const payload = JSON.parse(await readFile(/* turbopackIgnore: true */ fixtureFile, 'utf8'));
    const page = normalizePage(payload);
    if (page.items.length !== page.totalCount) throw new Error(MESSAGE);
    const recording = payload.recording;
    if (!recording || recording.kind !== 'recorded-subset' || recording.sourceUrl !== 'https://www.data.go.kr/data/15013109/standard.do' ||
      typeof recording.recordedAt !== 'string' || !Number.isFinite(Date.parse(recording.recordedAt)) ||
      !Number.isInteger(recording.upstreamTotalCount) || recording.upstreamTotalCount < page.totalCount ||
      !/^[a-f0-9]{64}$/.test(recording.originalResponseSha256 ?? '')) throw new Error(MESSAGE);
    data = { items: page.items, meta: {
      dataMode: 'sample', source: '공공데이터포털 전국도서관표준데이터 · 실제 응답에서 선정한 저장 예제 (현재 실행은 오프라인)',
      syncedAt: new Date().toISOString(), recordedAt: recording.recordedAt,
      scope: '대구 수성구 2곳·중구 1곳을 선정한 교육용 저장 예제', totalCount: page.items.length,
      upstreamTotalCount: recording.upstreamTotalCount, originalResponseSha256: recording.originalResponseSha256,
    } };
  } else {
    if (exercise !== 'success') throw new Error(MESSAGE);
    data = await fetchLive({ serviceKey, fetchFn });
  }
  return saveStore(data, file);
}
