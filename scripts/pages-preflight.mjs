import fs from 'node:fs';
import path from 'node:path';

const directory = path.resolve(process.argv[2] ?? 'work/cloudflare-development');
const environment = process.argv[3] ?? 'development';
if (!['development', 'production'].includes(environment)) {
  throw new Error('Explicit environment must be development or production.');
}
const backends = {
  development: 'https://kxezrgvnpoaqzcseymts.supabase.co',
  production: 'https://snqkfrcxjfdjkwxjiabc.supabase.co',
};
// Self-host deployments can supply their own expected and forbidden backend URL.
const expected = process.env.PAGES_EXPECTED_SUPABASE_URL || backends[environment];
const other =
  process.env.PAGES_FORBIDDEN_SUPABASE_URL ||
  backends[environment === 'production' ? 'development' : 'production'];
for (const value of [expected, other])
  if (!/^https:\/\/[^\s/]+(?::\d+)?$/.test(value))
    throw new Error('Backend check URLs must be explicit HTTPS origins.');
if (expected === other) throw new Error('Expected and forbidden backend must differ.');
const names = fs.readdirSync(path.join(directory, 'assets')).filter((name) => name.endsWith('.js'));
const bundle = names
  .map((name) => fs.readFileSync(path.join(directory, 'assets', name), 'utf8'))
  .join('\n');
const css = fs
  .readdirSync(path.join(directory, 'assets'))
  .filter((name) => name.endsWith('.css'))
  .map((name) => fs.readFileSync(path.join(directory, 'assets', name), 'utf8'))
  .join('\n');
const headers = fs.readFileSync(path.join(directory, '_headers'), 'utf8');
const checks = {
  expectedBackend: bundle.includes(expected),
  otherBackendAbsent: !bundle.includes(other),
  securityHeaders:
    headers.includes("font-src 'self' data:") && headers.includes("script-src 'self'"),
  cameraPermission: headers.includes('camera=(self), microphone=(), geolocation=()'),
  captureChoices: ['Foto struk', 'Tambah manual', 'Tambah transaksi'].every((label) =>
    bundle.includes(label),
  ),
  spaFallback: !fs.existsSync(path.join(directory, '404.html')),
  noEnvironmentFiles: fs.readdirSync(directory).every((name) => !name.startsWith('.env')),
  motionFoundation: [
    '.t-modal',
    '.t-page-slide',
    '.t-icon-swap',
    '.t-shimmer',
    '.t-stagger',
    '.t-acc-panel',
    '.t-toast',
    '.t-learn-chevron',
    'prefers-reduced-motion',
  ].every((selector) => css.includes(selector)),
};
console.log({ environment, ...checks });
if (Object.values(checks).some((value) => !value)) {
  throw new Error(`${environment} artifact failed deployment checks. Do not upload it.`);
}
