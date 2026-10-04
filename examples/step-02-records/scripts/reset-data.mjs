import { readFile, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
const folder = path.join(process.cwd(), 'data');
const current = path.join(folder, 'records.json');
const backup = path.join(folder, `records.backup.${Date.now()}.json`);
await copyFile(current, backup);
await writeFile(current, await readFile(path.join(folder, 'records.seed.json')));
console.log('기록된 실제 저장 예제 3건으로 복구했습니다. 이전 파일은 data/records.backup.<시각>.json에 보존했습니다.');
