import { readFile, writeFile } from 'node:fs/promises';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
// 공개 최종 앱과 같은 daisyUI 테마와 반응형 스타일 원본을 로컬에서 만듭니다.
const css = await postcss([tailwindcss({ optimize: true })]).process(await readFile('src/styles.css', 'utf8'), { from: 'src/styles.css', to: 'public/styles.css' });
await writeFile('public/styles.css', css.css);
