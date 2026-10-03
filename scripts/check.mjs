import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
const course = JSON.parse(await readFile('course.json', 'utf8'));
if (course.stages.length !== 6) throw new Error('6개 단계가 필요합니다.');
for (const stage of course.stages) {
  for (const file of ['package.json','package-lock.json','README.md','PROMPTS.md','CHECKLIST.md','LICENSE','.gitignore','.env.example','app/page.js','data/records.json']) await access(path.join(stage.folder, file));
  const ignore=await readFile(path.join(stage.folder,'.gitignore'),'utf8');
  for(const rule of ['node_modules/','.next/','.env*','!.env.example'])if(!ignore.split('\n').includes(rule))throw new Error(`독립 프로젝트의 제외 규칙이 없습니다: ${stage.id} ${rule}`);
  const data = JSON.parse(await readFile(path.join(stage.folder, 'data/records.json')));
  if (data.meta.dataMode !== 'sample' || data.items.length !== 3 || data.items[1].address !== '') throw new Error('가상 정상본 자료를 확인하세요.');
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
for (const folder of ['examples/step-04-api','examples/step-05-change']) {
  if (!fixture.equals(await readFile(path.join(folder, 'data/sample-api-response.json')))) throw new Error('실행 응답 파일이 가상 응답 정본과 다릅니다.');
}
console.log('6단계 manifest·독립 실행 파일·기본 가상 자료 계약을 확인했습니다.');
