// Fetch private Storage bytes without printing keys, paths, filenames, or financial data.
import { mkdtemp, writeFile, rm, realpath, mkdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.BACKUP_SUPABASE_URL,
  key = process.env.BACKUP_SUPABASE_SERVICE_ROLE_KEY,
  recipient = process.env.BACKUP_AGE_RECIPIENT;
if (!url || !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url) || !key || !recipient)
  throw new Error('Missing or invalid private Storage backup configuration.');
const headers = { apikey: key, Authorization: 'Bearer ' + key };
async function request(path, options = {}) {
  const response = await fetch(url + '/storage/v1/' + path, {
    ...options,
    headers: { ...headers, ...options.headers },
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw new Error('Storage backup request failed (' + response.status + ').');
  return response;
}
async function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    child.on('error', () => reject(new Error(command + ' unavailable.')));
    child.stderr.resume();
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(command + ' failed.'))));
  });
}
const privateRoot = await realpath(tmpdir()),
  directory = await mkdtemp(join(privateRoot, 'masuk-saku-storage-'));
const backupDirectory = join(root, 'backups');
await mkdir(backupDirectory, { recursive: true });
const stamp = new Date()
  .toISOString()
  .replaceAll('-', '')
  .replaceAll(':', '')
  .replace(/\.\d+Z$/, 'Z');
const archive = join(directory, 'storage.tar'),
  encrypted = join(backupDirectory, 'masuk-saku-' + stamp + '.storage.tar.age');
let complete = false;
try {
  const buckets = await (await request('bucket')).json();
  if (!Array.isArray(buckets)) throw new Error('Invalid bucket inventory.');
  const manifest = {
    schema_version: 1,
    source_url: url,
    exported_at: new Date().toISOString(),
    buckets: [],
    objects: [],
  };
  await mkdir(join(directory, 'objects'));
  for (const bucket of buckets) {
    manifest.buckets.push({
      id: bucket.id,
      name: bucket.name,
      public: bucket.public,
      file_size_limit: bucket.file_size_limit,
      allowed_mime_types: bucket.allowed_mime_types,
    });
    const queue = [''];
    while (queue.length) {
      const prefix = queue.shift();
      let offset = 0;
      for (;;) {
        const batch = await (
          await request('object/list/' + encodeURIComponent(bucket.id), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prefix,
              limit: 100,
              offset,
              sortBy: { column: 'name', order: 'asc' },
            }),
          })
        ).json();
        if (!Array.isArray(batch)) throw new Error('Invalid object inventory.');
        for (const object of batch) {
          const path = (prefix ? prefix + '/' : '') + object.name;
          if (!object.id) {
            queue.push(path);
            continue;
          }
          const file = String(manifest.objects.length).padStart(8, '0') + '.bin';
          const response = await request(
            'object/authenticated/' +
              encodeURIComponent(bucket.id) +
              '/' +
              path.split('/').map(encodeURIComponent).join('/'),
          );
          if (!response.body) throw new Error('Empty object response.');
          await pipeline(
            Readable.fromWeb(response.body),
            createWriteStream(join(directory, 'objects', file), { flags: 'wx', mode: 0o600 }),
          );
          manifest.objects.push({
            bucket_id: bucket.id,
            name: path,
            file,
            content_type: object.metadata?.mimetype ?? 'application/octet-stream',
            size: object.metadata?.size ?? null,
          });
        }
        offset += batch.length;
        if (batch.length < 100) break;
      }
    }
  }
  await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest), { mode: 0o600 });
  await run('tar', ['-cf', archive, '-C', directory, 'manifest.json', 'objects']);
  await run('age', ['--recipient', recipient, '--output', encrypted, archive]);
  complete = true;
  console.log('Private Storage backup encrypted; objects: ' + manifest.objects.length + '.');
} finally {
  // The created private temp directory is verified before any recursive removal.
  const target = await realpath(directory);
  if (
    target.startsWith(privateRoot + sep) &&
    dirname(target) === privateRoot &&
    target.split(sep).at(-1).startsWith('masuk-saku-storage-')
  )
    await rm(target, { recursive: true, force: true });
  if (!complete) await rm(encrypted, { force: true });
}
