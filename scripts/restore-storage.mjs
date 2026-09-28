// Dry run is the default. Only apply to an explicitly configured isolated project.
import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import { resolve } from 'node:path';
const archive = process.argv.find((v) => v.endsWith('.tar'));
if (!archive)
  throw new Error('Usage: node scripts/restore-storage.mjs decrypted.storage.tar [--apply]');
async function readManifest() {
  return new Promise((resolve, reject) => {
    const child = spawn('tar', ['-xOf', resolvePath(), 'manifest.json'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const chunks = [];
    let size = 0;
    child.stdout.on('data', (part) => {
      size += part.length;
      if (size > 20 * 1024 * 1024) {
        child.kill();
        reject(new Error('Manifest too large.'));
      } else chunks.push(part);
    });
    child.on('error', () => reject(new Error('tar unavailable.')));
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error('Manifest unavailable.'));
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        reject(new Error('Invalid manifest.'));
      }
    });
  });
}
function resolvePath() {
  return resolve(archive);
}
const manifest = await readManifest();
if (
  manifest.schema_version !== 1 ||
  !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(manifest.source_url) ||
  !Array.isArray(manifest.objects) ||
  !Array.isArray(manifest.buckets)
)
  throw new Error('Invalid Storage manifest.');
const names = new Set();
for (const object of manifest.objects) {
  if (
    !/^\d{8}\.bin$/.test(object.file) ||
    typeof object.name !== 'string' ||
    object.name.length > 1024 ||
    object.name.split('/').some((v) => !v || v === '.' || v === '..') ||
    object.name.includes('\\') ||
    !manifest.buckets.some((b) => b.id === object.bucket_id) ||
    names.has(object.bucket_id + ':' + object.name)
  )
    throw new Error('Invalid object reference.');
  names.add(object.bucket_id + ':' + object.name);
}
console.log('Validated Storage restore inventory; objects: ' + manifest.objects.length + '.');
if (process.argv.includes('--apply')) {
  const url = process.env.RESTORE_SUPABASE_URL,
    key = process.env.RESTORE_SUPABASE_SERVICE_ROLE_KEY;
  if (
    !url ||
    !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url) ||
    url === manifest.source_url ||
    !key ||
    process.env.RESTORE_ISOLATED_PROJECT_REF !== new URL(url).hostname.split('.')[0]
  )
    throw new Error(
      'Apply requires a different, explicitly named isolated project and private credentials.',
    );
  const headers = { apikey: key, Authorization: 'Bearer ' + key };
  for (const bucket of manifest.buckets) {
    const existing = await fetch(url + '/storage/v1/bucket/' + encodeURIComponent(bucket.id), {
      headers,
    });
    if (existing.status === 404) {
      const result = await fetch(url + '/storage/v1/bucket', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(bucket),
      });
      if (!result.ok) throw new Error('Bucket creation failed.');
    } else if (!existing.ok) throw new Error('Bucket check failed.');
  }
  for (const object of manifest.objects) {
    const child = spawn('tar', ['-xOf', resolvePath(), 'objects/' + object.file], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const completed = new Promise((resolve, reject) => {
      child.on('error', () => reject(new Error('Object stream unavailable.')));
      child.on('close', (code) =>
        code === 0 ? resolve() : reject(new Error('Object stream failed.')),
      );
    });
    try {
      const response = await fetch(
        url +
          '/storage/v1/object/' +
          encodeURIComponent(object.bucket_id) +
          '/' +
          object.name.split('/').map(encodeURIComponent).join('/'),
        {
          method: 'POST',
          headers: { ...headers, 'Content-Type': object.content_type, 'x-upsert': 'true' },
          body: Readable.toWeb(child.stdout),
          duplex: 'half',
          signal: AbortSignal.timeout(120000),
        },
      );
      await completed;
      if (!response.ok) throw new Error('Object restore failed (' + response.status + ').');
    } catch (error) {
      child.kill();
      await completed.catch(() => {});
      throw error;
    }
  }
  console.log('Storage objects restored to the isolated target.');
} else console.log('Dry run only. No remote data changed.');
