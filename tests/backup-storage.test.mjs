import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
test('storage restore dry-run validates inventory without credentials and rejects unsafe archive references', () => {
  const base = realpathSync(tmpdir()),
    directory = mkdtempSync(join(base, 'masuk-saku-storage-test-'));
  try {
    mkdirSync(join(directory, 'objects'));
    writeFileSync(join(directory, 'objects', '00000000.bin'), 'fixture');
    const manifest = {
      schema_version: 1,
      source_url: 'https://sourceproject.supabase.co',
      buckets: [{ id: 'receipts' }],
      objects: [
        {
          bucket_id: 'receipts',
          name: 'h/user/id',
          file: '00000000.bin',
          content_type: 'image/png',
        },
      ],
    };
    const run = () => {
      writeFileSync(join(directory, 'manifest.json'), JSON.stringify(manifest));
      const tar = spawnSync(
        'tar',
        ['-cf', join(directory, 'fixture.tar'), '-C', directory, 'manifest.json', 'objects'],
        { encoding: 'utf8' },
      );
      assert.equal(tar.status, 0);
      return spawnSync(
        process.execPath,
        ['scripts/restore-storage.mjs', join(directory, 'fixture.tar')],
        { encoding: 'utf8' },
      );
    };
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Dry run only/);
    manifest.objects[0].file = '../secret';
    assert.notEqual(run().status, 0);
  } finally {
    const actual = realpathSync(directory);
    assert.equal(dirname(actual), base);
    rmSync(actual, { recursive: true, force: true });
  }
});
