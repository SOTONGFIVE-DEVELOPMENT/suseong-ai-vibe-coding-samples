export function allowLocalWrite(request) {
  const target = new URL(request.url);
  const host = request.headers.get('host');
  const origin = request.headers.get('origin');
  // Next는 request.url의 내부 hostname을 localhost로 합성할 수 있습니다.
  // 브라우저 주소인 Host를 별도로 검사하고 Origin과 정확히 비교합니다.
  let browserAddress;
  try { browserAddress = new URL(`${target.protocol}//${host}`); } catch { return false; }
  const local = hostname => ['127.0.0.1', 'localhost'].includes(hostname);
  if (target.protocol !== 'http:' || !local(target.hostname) || !local(browserAddress.hostname) || browserAddress.host !== host || browserAddress.username || browserAddress.password || browserAddress.port !== target.port || origin !== browserAddress.origin || request.headers.get('sec-fetch-site') === 'cross-site' || !request.headers.get('content-type')?.startsWith('application/json')) return false;
  return true;
}
export async function readSmallJson(request) {
  if (Number(request.headers.get('content-length')) > 1024) throw new Error('요청이 너무 큽니다.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('요청 내용을 확인하세요.');
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 1024) throw new Error('요청이 너무 큽니다.');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
