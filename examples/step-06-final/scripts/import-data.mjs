const args = process.argv.slice(2);
let port = 3000;
let exercise = 'success';
for (let index = 0; index < args.length; index++) {
  const key = args[index];
  const value = args[++index];
  if (key === '--port' && /^\d+$/.test(value ?? '') && Number(value) > 0 && Number(value) < 65536) port = Number(value);
  else if (key === '--exercise' && ['success', 'timeout', 'auth', 'malformed'].includes(value)) exercise = value;
  else {
    console.error('사용법: npm run import-data -- [--port 3001] [--exercise timeout|auth|malformed]');
    process.exit(1);
  }
}
const origin = `http://127.0.0.1:${port}`;
try {
  const response = await fetch(`${origin}/api/import`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ exercise }), signal: AbortSignal.timeout(35000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '자료 저장에 실패했습니다. 기존 자료와 README를 확인하세요.');
  console.log(`${data.meta.dataMode === 'sample' ? '저장 응답 재생' : '실제 API 수집'}: ${data.meta.totalCount}건 저장. 브라우저의 ‘다시 조회’를 누르세요.`);
} catch (error) {
  console.error(error.message?.startsWith('교육용 ') ? error.message : '자료를 저장하지 못했습니다. 서버 실행 주소·선택 모드·README를 확인하세요. 기존 정상 파일은 유지됩니다.');
  process.exitCode = 1;
}
