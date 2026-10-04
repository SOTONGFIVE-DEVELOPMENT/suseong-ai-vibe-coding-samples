import { readFile, copyFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { saveStore, validateStore } from '../lib/store.mjs';

// 별도 단계 복사본에서만 사용합니다. 원본 fixture와 복구 seed는 수정하지 않습니다.
export async function prepareTransfer({ folder = process.cwd(), confirmCopy = false } = {}) {
  if (!confirmCopy) throw new Error('단계 ZIP을 별도 폴더에 풀고 서버를 중지한 뒤 npm run prepare-transfer -- --copy를 실행하세요.');
  const dataFolder = path.join(folder, 'data');
  const data = validateStore(JSON.parse(await readFile(path.join(dataFolder, 'records.synthetic.json'), 'utf8')));
  if (data.meta.dataKind !== 'synthetic') throw new Error('가상 전이 자료인지 확인하세요.');
  const file = path.join(dataFolder, 'records.json');
  const backup = path.join(dataFolder, `records.backup.${Date.now()}.${randomUUID()}.json`);
  await copyFile(file, backup, constants.COPYFILE_EXCL);
  await saveStore(data, file);
  return { data, backup };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    await prepareTransfer({ confirmCopy: process.argv.slice(2).includes('--copy') });
    console.log('별도 복사본을 가상 시설 3건으로 준비했습니다. 이전 파일은 data/records.backup.<시각>.<ID>.json에 보존했습니다.');
    console.log('meta는 가상 자료 표시를 유지하고 items만 업무에 맞게 바꾸세요. 실제 저장 예제로 돌아가려면 npm run reset-data를 실행하세요.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
