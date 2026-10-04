import { readFile } from 'node:fs/promises';
import path from 'node:path';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// 공개 최종 앱의 HTML을 그대로 표시하고 API·저장소는 이전 실습을 이어 씁니다.
export async function GET() {
  const html = await readFile(path.join(process.cwd(), 'public', 'index.html'), 'utf8');
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
