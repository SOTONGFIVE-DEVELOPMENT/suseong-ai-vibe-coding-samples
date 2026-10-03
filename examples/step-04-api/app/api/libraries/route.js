import { readStore } from '../../../lib/store.mjs';
import { filterRecords } from '../../../lib/filter.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  try {
    const data = await readStore();
    const url = new URL(request.url);
    const items = filterRecords(data.items, { query: url.searchParams.get('q') ?? '', region: url.searchParams.get('region') ?? '', type: url.searchParams.get('type') ?? '' });
    return Response.json({ ...data, items, count: items.length }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: '자료 파일을 읽지 못했습니다. data/records.json의 JSON 형식을 확인하고 정상본과 비교하세요.' }, { status: 500 });
  }
}
