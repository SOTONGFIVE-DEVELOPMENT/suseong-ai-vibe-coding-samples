import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
const course = JSON.parse(await readFile('course.json', 'utf8'));
if (course.stages.length !== 6) throw new Error('6개 단계가 필요합니다.');
for (const stage of course.stages) {
  for (const file of ['package.json','package-lock.json','README.md','PROMPTS.md','CHECKLIST.md','LICENSE','.gitignore','.env.example','app/page.js','data/records.json']) await access(path.join(stage.folder, file));
  const ignore=await readFile(path.join(stage.folder,'.gitignore'),'utf8');
  for(const rule of ['node_modules/','.next/','.env*','!.env.example'])if(!ignore.split('\n').includes(rule))throw new Error(`독립 프로젝트의 제외 규칙이 없습니다: ${stage.id} ${rule}`);
  const data = JSON.parse(await readFile(path.join(stage.folder, 'data/records.json')));
  if (data.meta.dataMode !== 'sample' || data.items.length !== 3 || data.meta.totalCount !== 3 || data.meta.upstreamTotalCount !== 242 || data.meta.recordedAt !== '2026-10-04T10:17:37Z' || data.meta.syncedAt !== null || !data.items.every(item => item.address && item.phone && item.referenceDate)) throw new Error('실제 저장 예제와 수집 근거를 확인하세요.');
  if (data.items.map(item => item.name).join('|') !== '수성구립용학도서관|수성구립사월책문화센터도서관|2.28민주운동 기념회관') throw new Error('선정한 도서관 이름이 다릅니다.');
  if (data.items.filter(item => item.region === '대구 수성구').length !== 2 || data.items.filter(item => item.name.includes('사월')).length !== 1) throw new Error('3→1→0→3과 지역 조건의 교육 기준을 확인하세요.');
  if (stage.success.join('|') !== JSON.parse(await readFile(path.join(stage.folder, 'stage.json'))).success.join('|')) throw new Error('성공 기준 사본이 정본과 다릅니다.');
  if (Number(stage.id.slice(-2)) >= 2 && !(await readFile(path.join(stage.folder, 'data/records.json'))).equals(await readFile(path.join(stage.folder, 'data/records.seed.json')))) throw new Error('복구 자료가 초기 저장 예제와 다릅니다.');
  const pkg = JSON.parse(await readFile(path.join(stage.folder, 'package.json')));
  if (pkg.scripts.dev !== 'next dev --hostname 127.0.0.1') throw new Error('실행 주소를 확인하세요.');
  if (pkg.engines.node !== '>=22 <23') throw new Error('Node22 기준을 확인하세요.');
}
for (const folder of ['examples/step-04-api','examples/step-05-change']) {
  for (const file of ['docs/api-spec.md','api-response.sample.json']) {
    const canonical = await readFile(file);
    const standalone = await readFile(path.join(folder, file));
    if (!canonical.equals(standalone)) throw new Error('독립 ZIP 명세 사본이 정본과 다릅니다.');
  }
}
const fixture = await readFile('api-response.sample.json');
const saved = JSON.parse(fixture);
if (saved.recording.kind !== 'recorded-subset' || saved.recording.upstreamTotalCount !== 242 || saved.response.body.totalCount !== 3 || saved.response.body.items.length !== 3) throw new Error('교육용 부분 자료의 응답 범위를 확인하세요.');
for (const stage of course.stages) {
  const data = JSON.parse(await readFile(path.join(stage.folder, 'data/records.json')));
  if (data.meta.originalResponseSha256 !== saved.recording.originalResponseSha256) throw new Error('원본 응답 지문이 다릅니다.');
  for (const [index, item] of data.items.entries()) {
    const raw = saved.response.body.items[index];
    if (item.name !== raw.lbrryNm || item.address !== raw.rdnmadr || item.phone !== raw.phoneNumber || item.referenceDate !== raw.referenceDate) throw new Error('원본 공개 필드가 변경됐습니다.');
  }
}
for (const folder of ['examples/step-04-api','examples/step-05-change']) {
  if (!fixture.equals(await readFile(path.join(folder, 'data/sample-api-response.json')))) throw new Error('실행 응답 파일이 저장 응답 정본과 다릅니다.');
}
console.log('6단계 manifest·독립 실행 파일·실제 저장 자료·수집 근거 계약을 확인했습니다.');
