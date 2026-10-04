import { readStore } from '../../../lib/store.mjs';
import { parseFinalFilters, finalLibraryResponse } from '../../../lib/final-response.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  let filters;
  try { filters = parseFinalFilters(new URL(request.url)); }
  catch { return Response.json({ error: '검색 조건을 확인하세요.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } }); }
  try {
    const data = await readStore();
    return Response.json(finalLibraryResponse(data, filters), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: '자료 파일을 읽지 못했습니다. data/records.json의 JSON 형식을 확인하고 정상본과 비교하세요.' }, { status: 500 });
  }
}
