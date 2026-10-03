import { importRecords } from '../../../lib/api-source.mjs';
import { allowLocalWrite, readSmallJson } from '../../../lib/local-request.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
let pending = Promise.resolve();
export async function POST(request) {
  if (!allowLocalWrite(request)) return Response.json({ error: '실습 화면에서 같은 주소로 요청하세요.' }, { status: 403 });
  let exercise;
  try { exercise = (await readSmallJson(request)).exercise ?? 'success'; }
  catch { return Response.json({ error: '요청 형식을 확인하세요.' }, { status: 400 }); }
  // 한 번에 한 갱신만 실행합니다. 대기 중 실패가 다음 요청을 막지 않습니다.
  const job = pending.then(() => importRecords({ exercise }));
  pending = job.catch(() => {});
  try {
    const data = await job;
    return Response.json({ ...data, count: data.items.length });
  } catch (error) {
    const sample = (process.env.DATA_MODE ?? 'sample') === 'sample';
    const message = sample && ['timeout', 'auth', 'malformed'].includes(exercise) ? error.message : 'API 연결 또는 응답 검증에 실패했습니다. 기존 저장 파일은 유지됩니다. README의 복구 절차를 확인하세요.';
    return Response.json({ error: message }, { status: 502 });
  }
}
