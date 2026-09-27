// Check Git's actual staged tree locally; on CI check the committed tree.
// Diagnostics report file paths and categories only, never matching values.
import { execFileSync } from 'node:child_process';
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const forbidden =
  /(^|\/)(?:node_modules|dist|work|backups|\.supabase|\.temp)(?:\/|$)|(^|\/)\.env(?:\.|$)|\.(?:dump|age|pem|key|dpapi\.txt)$|^NOTES\.md$|^docs\/(?:screenshots\/|source\/PRD-conversation-excerpt\.md$)/;
const allowed = new Set(['.env.example', 'supabase/functions/.env.example']);
const patterns = [
  [
    'private API key',
    /\b(?:sb_secret_[A-Za-z0-9_-]{20,}|sk-or-v1-[a-f0-9]{40,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/,
  ],
  ['private key material', /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/],
  ['database password URL', /postgres(?:ql)?:\/\/[^\s/:]+:[^\s@]{8,}@/],
];
const failures = [];
for (const file of files) {
  if (forbidden.test(file) && !allowed.has(file)) failures.push(`${file}: private/generated file`);
  const value = execFileSync('git', ['show', ':' + file], { maxBuffer: 16 * 1024 * 1024 });
  if (value.includes(0)) continue;
  const text = value.toString('utf8');
  for (const [label, pattern] of patterns)
    if (pattern.test(text)) failures.push(`${file}: ${label}`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  `Public source guard passed: ${files.length} files. Review remains required; pattern scanning is not proof that every secret is absent.`,
);
