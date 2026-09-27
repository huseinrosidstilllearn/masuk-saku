import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function runFixture(kind, fail = false) {
  const root = mkdtempSync(path.join(tmpdir(), 'masuk-saku-drive-test-'));
  try {
    for (const dir of ['scripts', 'backups', 'bin']) mkdirSync(path.join(root, dir));
    copyFileSync(
      new URL('../scripts/upload-backup-drive.sh', import.meta.url),
      path.join(root, 'scripts/upload-backup-drive.sh'),
    );
    writeFileSync(path.join(root, 'backups/masuk-saku-test.dump'), 'PLAINTEXT MUST NOT UPLOAD');
    if (kind !== 'missing')
      writeFileSync(
        path.join(root, 'backups/masuk-saku-test.dump.age'),
        kind === 'renamed' ? 'PLAINTEXT DUMP' : 'age-encryption.org/v1\nfixture ciphertext',
      );
    writeFileSync(
      path.join(root, 'bin/rclone'),
      `#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$1" >> rclone-calls.txt
args=("$@")
for ((i=0;i<\${#args[@]};i++)); do
 if [[ "\${args[i]}" == '--config' ]]; then
  config="\${args[i+1]}"
  [[ -s "$config" ]]
  if command -v cygpath >/dev/null; then cygpath -w "$config" > config-path.txt; else printf '%s' "$config" > config-path.txt; fi
 fi
done
[[ " $* " == *" --include /masuk-saku-*.dump.age "* ]]
[[ " $* " != *" sync "* ]]
if [[ "\${FAIL_UPLOAD:-0}" == 1 ]]; then exit 42; fi
`,
      { mode: 0o755 },
    );
    const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : '/bin/bash';
    const result = spawnSync(
      bash,
      ['-c', 'export PATH="$PWD/bin:$PATH"; bash scripts/upload-backup-drive.sh'],
      {
        cwd: root,
        env: {
          ...process.env,
          BACKUP_RCLONE_CONFIG: '[drivebackup]\ntype = drive\ntoken = fixture-private-value',
          FAIL_UPLOAD: fail ? '1' : '0',
        },
        encoding: 'utf8',
      },
    );
    assert.ifError(result.error);
    assert.ok(!`${result.stdout}${result.stderr}`.includes('fixture-private-value'));
    const calls = existsSync(path.join(root, 'rclone-calls.txt'))
      ? readFileSync(path.join(root, 'rclone-calls.txt'), 'utf8').trim().split(/\r?\n/)
      : [];
    if (existsSync(path.join(root, 'config-path.txt')))
      assert.equal(
        existsSync(readFileSync(path.join(root, 'config-path.txt'), 'utf8').trim()),
        false,
        'private config must be removed after success/failure',
      );
    return { status: result.status, calls };
  } finally {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(tmpdir()));
    assert.ok(path.basename(root).startsWith('masuk-saku-drive-test-'));
    rmSync(root, { recursive: true, force: true });
  }
}

test('only encrypted-name files are copied and verified; private config is removed', () => {
  assert.deepEqual(runFixture('encrypted'), { status: 0, calls: ['copy', 'check'] });
});
test('missing encrypted file prevents upload', () => {
  assert.deepEqual(runFixture('missing'), { status: 1, calls: [] });
});
test('renamed plaintext dump is refused before upload', () => {
  assert.deepEqual(runFixture('renamed'), { status: 1, calls: [] });
});
test('upload failure prevents verification and removes private configuration', () => {
  assert.deepEqual(runFixture('encrypted', true), { status: 42, calls: ['copy'] });
});
