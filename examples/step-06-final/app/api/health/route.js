export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET() {
  return Response.json({ ok: true, apiConfigured: Boolean(process.env.DATA_GO_KR_SERVICE_KEY?.trim()), version: 'local-step-06' }, { headers: { 'Cache-Control': 'no-store' } });
}
