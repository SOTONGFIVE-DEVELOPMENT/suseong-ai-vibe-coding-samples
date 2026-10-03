import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// Dependency-free, deterministic, uncompressed ZIPs. Every path comes from Git.
const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(process.argv[2] || '../suseong-ai-vibe-coding/public/downloads');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
if (git('status', '--porcelain')) throw new Error('Commit the verified sample source before packaging.');
const sourceCommit = git('rev-parse', 'HEAD');
const course = JSON.parse(await readFile(join(root, 'course.json'), 'utf8'));
const paths = git('ls-files', '-z').split('\0').filter(Boolean).sort();
const table = Uint32Array.from({ length: 256 }, (_, n) => {
  for (let bit = 0; bit < 8; bit++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
const crc32 = bytes => {
  let n = 0xffffffff;
  for (const byte of bytes) n = table[(n ^ byte) & 255] ^ (n >>> 8);
  return (n ^ 0xffffffff) >>> 0;
};
async function archive(selected, prefix, strip = '') {
  const bodies = [], entries = [];
  let offset = 0;
  for (const path of selected) {
    if (/(^|\/)(node_modules|\.next|\.git)(\/|$)/.test(path) || /(^|\/)\.env[^/]*$/.test(path) && !path.endsWith('/.env.example') && path!=='.env.example') throw new Error(`Unsafe archive path: ${path}`);
    const name = Buffer.from(`${prefix}/${path.slice(strip.length)}`, 'utf8');
    const data = await readFile(join(root, path));
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x800, 6); local.writeUInt16LE(33, 12); // UTF-8, 1980-01-01.
    const crc = crc32(data);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22); local.writeUInt16LE(name.length, 26);
    bodies.push(local, name, data);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x800, 8); entry.writeUInt16LE(33, 14);
    entry.writeUInt32LE(crc, 16); entry.writeUInt32LE(data.length, 20);
    entry.writeUInt32LE(data.length, 24); entry.writeUInt16LE(name.length, 28);
    entry.writeUInt32LE(offset, 42); entries.push(entry, name);
    offset += local.length + name.length + data.length;
  }
  const directory = Buffer.concat(entries), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(selected.length, 8);
  end.writeUInt16LE(selected.length, 10); end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...bodies, directory, end]);
}
await mkdir(output, { recursive: true });
const downloads = [];
async function save(name, selected, prefix, strip) {
  if (!selected.length) throw new Error(`Empty archive: ${name}`);
  const bytes = await archive(selected, prefix, strip);
  if (bytes.length > 25 * 1024 * 1024) throw new Error(`Pages asset too large: ${name}`);
  await writeFile(join(output, name), bytes);
  downloads.push({ file: name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
for (const stage of course.stages) {
  await save(stage.zip, paths.filter(path => path.startsWith(`${stage.folder}/`)), basename(stage.folder), `${stage.folder}/`);
}
await save('day1-workbook.zip', paths.filter(path => path.startsWith('docs/day1/')), 'day1-workbook', 'docs/day1/');
await save('all-course-samples.zip', paths, 'suseong-ai-vibe-coding-samples', '');
const manifest = { ...course, sourceCommit, packagedAt: new Date().toISOString(), downloads };
await writeFile(join(output, 'course.json'), JSON.stringify(manifest, null, 2) + '\n');
await writeFile(join(output, 'SHA256SUMS.txt'), downloads.map(item => `${item.sha256}  ${item.file}`).join('\n') + '\n');
console.log(`Packaged ${downloads.length} downloads from ${sourceCommit} → ${output}`);
