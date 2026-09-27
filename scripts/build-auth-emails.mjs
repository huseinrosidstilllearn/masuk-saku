import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const formatting = { ...(await resolveConfig(import.meta.filename)), parser: 'html' };
const directory = path.join(root, 'supabase/templates');
fs.mkdirSync(directory, { recursive: true });

const templates = [
  {
    key: 'confirmation',
    label: 'Confirm signup',
    subject: 'Konfirmasi email kamu — Masuk Saku',
    title: 'Satu langkah lagi, sakumu siap.',
    preview: 'Konfirmasi email untuk mulai mencatat keuanganmu.',
    body: 'Selamat datang di Masuk Saku. Konfirmasi alamat email ini untuk melanjutkan pendaftaran dan mulai merapikan catatan keuanganmu.',
    action: 'Konfirmasi email',
    note: 'Jika kamu tidak mendaftar di Masuk Saku, abaikan email ini. Akun belum terverifikasi sebelum konfirmasi dilakukan.',
  },
  {
    key: 'invite',
    label: 'Invite user',
    subject: 'Undangan membuat akun — Masuk Saku',
    title: 'Sakumu menunggu.',
    preview: 'Kamu diundang untuk membuat akun Masuk Saku.',
    body: 'Kamu menerima undangan untuk membuat akun di Masuk Saku. Gunakan tombol di bawah untuk menerima undangan dan melanjutkan akses akun.',
    action: 'Terima undangan',
    note: 'Undangan ini untuk akses akun aplikasi. Bergabung ke household keluarga mengikuti undangan household yang terpisah. Jika tidak mengenali undangan ini, abaikan email.',
  },
  {
    key: 'magic_link',
    label: 'Magic link or OTP',
    subject: 'Tautan masuk kamu — Masuk Saku',
    title: 'Masuk ke sakumu.',
    preview: 'Tautan sekali pakai untuk masuk ke akunmu.',
    body: 'Kami menerima permintaan masuk ke akun Masuk Saku. Gunakan tautan di bawah. Jika layar verifikasi meminta kode, gunakan kode yang tercantum di email ini.',
    action: 'Masuk ke akun',
    code: true,
    note: 'Tautan dan kode hanya untukmu. Jangan membagikannya kepada siapa pun. Jika kamu tidak meminta akses ini, abaikan email.',
  },
  {
    key: 'email_change',
    label: 'Change email address',
    subject: 'Konfirmasi perubahan email — Masuk Saku',
    title: 'Konfirmasi perubahan email.',
    preview: 'Tinjau dan konfirmasi permintaan perubahan alamat email akunmu.',
    body: 'Kami menerima permintaan mengganti alamat email akun Masuk Saku. Konfirmasikan permintaan ini melalui tombol di bawah. Untuk pengamanan akun, konfirmasi dapat diperlukan pada alamat email lama dan baru.',
    detail: 'Alamat email baru: <strong>{{ .NewEmail }}</strong>',
    action: 'Konfirmasi perubahan',
    note: 'Jika kamu tidak meminta perubahan ini, jangan klik tautan konfirmasi. Periksa keamanan akunmu melalui Masuk Saku.',
  },
  {
    key: 'recovery',
    label: 'Reset password',
    subject: 'Atur ulang kata sandi — Masuk Saku',
    title: 'Buat kata sandi baru.',
    preview: 'Lanjutkan permintaan pemulihan akun Masuk Saku.',
    body: 'Kami menerima permintaan untuk mengatur ulang kata sandi akunmu. Gunakan tombol di bawah untuk melanjutkan proses pemulihan.',
    action: 'Atur ulang kata sandi',
    note: 'Jika kamu tidak meminta pemulihan, abaikan email ini. Permintaan ini sendiri belum mengubah kata sandimu.',
  },
  {
    key: 'reauthentication',
    label: 'Reauthentication',
    subject: 'Kode verifikasi keamanan — Masuk Saku',
    title: 'Pastikan ini benar-benar kamu.',
    preview: 'Gunakan kode ini untuk mengonfirmasi tindakan sensitif pada akunmu.',
    body: 'Masukkan kode di bawah pada layar verifikasi Masuk Saku untuk melanjutkan tindakan yang kamu minta.',
    code: true,
    note: 'Jangan membagikan kode ini kepada siapa pun. Jika kamu tidak meminta verifikasi, jangan gunakan kode dan periksa keamanan akunmu.',
  },
  {
    key: 'password_changed',
    label: 'Password changed',
    subject: 'Kata sandi akunmu berubah — Masuk Saku',
    title: 'Kata sandi telah diubah.',
    preview: 'Pemberitahuan keamanan: kata sandi akun Masuk Saku berubah.',
    body: 'Kata sandi akun Masuk Saku kamu telah diubah. Jika perubahan ini kamu lakukan, tidak ada tindakan tambahan yang diperlukan.',
  },
  {
    key: 'email_changed',
    label: 'Email address changed',
    subject: 'Alamat email akunmu berubah — Masuk Saku',
    title: 'Alamat email telah diubah.',
    preview: 'Pemberitahuan keamanan: alamat email akunmu berubah.',
    body: 'Alamat email akun Masuk Saku telah diperbarui. Tinjau perubahan berikut.',
    detail:
      'Email sebelumnya: <strong>{{ .OldEmail }}</strong><br />Email saat ini: <strong>{{ .Email }}</strong>',
  },
  {
    key: 'phone_changed',
    label: 'Phone number changed',
    subject: 'Nomor telepon akunmu berubah — Masuk Saku',
    title: 'Nomor telepon telah diubah.',
    preview: 'Pemberitahuan keamanan: nomor telepon akunmu berubah.',
    body: 'Nomor telepon yang terkait dengan akun Masuk Saku telah diubah.',
    detail:
      'Nomor sebelumnya: <strong>{{ .OldPhone }}</strong><br />Nomor saat ini: <strong>{{ .Phone }}</strong>',
  },
  {
    key: 'identity_linked',
    label: 'Sign-in method linked',
    subject: 'Metode masuk ditambahkan — Masuk Saku',
    title: 'Metode masuk baru terhubung.',
    preview: 'Pemberitahuan keamanan: metode masuk ditambahkan ke akunmu.',
    body: 'Sebuah metode masuk telah dihubungkan ke akun Masuk Saku kamu.',
    detail: 'Penyedia metode masuk: <strong>{{ .Provider }}</strong>',
  },
  {
    key: 'identity_unlinked',
    label: 'Sign-in method removed',
    subject: 'Metode masuk dihapus — Masuk Saku',
    title: 'Metode masuk telah dilepas.',
    preview: 'Pemberitahuan keamanan: metode masuk dihapus dari akunmu.',
    body: 'Sebuah metode masuk telah dilepas dari akun Masuk Saku kamu.',
    detail: 'Penyedia metode masuk: <strong>{{ .Provider }}</strong>',
  },
  {
    key: 'mfa_factor_enrolled',
    label: 'MFA method added',
    subject: 'Verifikasi tambahan diaktifkan — Masuk Saku',
    title: 'Pengamanan akun ditambahkan.',
    preview: 'Pemberitahuan keamanan: metode verifikasi tambahan ditambahkan.',
    body: 'Sebuah metode verifikasi tambahan telah didaftarkan pada akun Masuk Saku kamu.',
    detail: 'Jenis metode: <strong>{{ .FactorType }}</strong>',
  },
  {
    key: 'mfa_factor_unenrolled',
    label: 'MFA method removed',
    subject: 'Verifikasi tambahan dihapus — Masuk Saku',
    title: 'Metode verifikasi telah dihapus.',
    preview: 'Pemberitahuan keamanan: metode verifikasi tambahan dihapus.',
    body: 'Sebuah metode verifikasi tambahan telah dihapus dari akun Masuk Saku kamu.',
    detail: 'Jenis metode: <strong>{{ .FactorType }}</strong>',
  },
];

function markup(t, security) {
  const href = security ? '{{ .SiteURL }}' : '{{ .ConfirmationURL }}';
  const action = security ? 'Buka Masuk Saku' : t.action;
  const note = security
    ? 'Jika perubahan ini bukan kamu yang melakukan, jangan abaikan pemberitahuan ini. Buka Masuk Saku dari alamat situs yang kamu kenal, periksa akses akun, dan segera lakukan pemulihan akun bila diperlukan.'
    : t.note;
  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${t.subject}</title>
  <style>@media only screen and (max-width: 600px) { .outer { padding: 20px 12px !important; } .inner { padding: 28px 22px !important; } .heading { font-size: 28px !important; } }</style>
</head>
<body style="margin:0;padding:0;background-color:#f2f3f5;color:#202126;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${t.preview}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f2f3f5;">
    <tr><td class="outer" align="center" style="padding:40px 16px;">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:560px;">
        <tr><td style="padding:0 4px 22px;font-size:24px;font-weight:800;letter-spacing:-1px;color:#202126;">Masuk Saku<span style="color:#ed7556;">.</span></td></tr>
        <tr><td style="padding:0;background-color:#ffffff;border:1px solid #e4e6e9;border-radius:24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr><td class="inner" style="padding:36px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:8px 12px;background-color:${security ? '#ffe6dc' : '#e7f3bb'};border-radius:8px;font-size:11px;font-weight:700;letter-spacing:1px;color:#303426;">${security ? 'KEAMANAN AKUN' : 'AKUN MASUK SAKU'}</td></tr></table>
              <h1 class="heading" style="margin:22px 0 16px;font-size:32px;line-height:1.2;font-weight:800;letter-spacing:-1px;color:#202126;">${t.title}</h1>
              <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:#555b65;">${t.body}</p>
              ${t.detail ? `<p style="margin:0 0 24px;padding:16px;background-color:#f5f6f8;border-radius:12px;font-size:14px;line-height:1.8;color:#444b55;overflow-wrap:anywhere;word-break:break-word;">${t.detail}</p>` : ''}
              ${t.code ? '<p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#626974;">KODE VERIFIKASI</p><p style="margin:0 0 24px;padding:18px 12px;background-color:#f5f6f8;border-radius:12px;font-family:Courier New,Courier,monospace;font-size:28px;font-weight:700;letter-spacing:4px;text-align:center;color:#202126;">{{ .Token }}</p>' : ''}
              ${action ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#202126" style="background-color:#202126;border-radius:12px;text-align:center;"><a href="${href}" style="display:inline-block;padding:16px 24px;border:1px solid #202126;border-radius:12px;color:#ffffff;font-size:15px;line-height:1.3;font-weight:700;text-decoration:none;mso-padding-alt:0;text-underline-color:#202126;"><!--[if mso]><i style="letter-spacing:24px;mso-font-width:-100%;mso-text-raise:24pt;">&nbsp;</i><![endif]--><span style="mso-text-raise:12pt;">${action}</span><!--[if mso]><i style="letter-spacing:24px;mso-font-width:-100%;">&nbsp;</i><![endif]--></a></td></tr></table>` : ''}
              ${!security && action ? '<p style="margin:22px 0 0;font-size:12px;line-height:1.7;color:#727985;">Tombol tidak terbuka? Salin tautan berikut ke browser:</p><p style="margin:6px 0 0;font-size:12px;line-height:1.7;overflow-wrap:anywhere;word-break:break-all;"><a href="{{ .ConfirmationURL }}" style="color:#485349;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>' : ''}
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding-top:28px;"><p style="margin:0;padding-top:22px;border-top:1px solid #e9ebef;font-size:13px;line-height:1.7;color:#6a717c;">${note}</p></td></tr></table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 8px 0;font-size:12px;line-height:1.8;color:#777d87;text-align:center;">Satu saku, semua catatan keuangan.<br />Email otomatis dari Masuk Saku. Tidak perlu membalas email ini.<br /><a href="{{ .SiteURL }}" style="color:#5f6671;text-decoration:underline;">Buka Masuk Saku</a></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;
}

const manifest = templates.map((t, index) => {
  const kind = index < 6 ? 'template' : 'notification';
  const filename = `${t.key}.html`;
  return { key: t.key, kind, label: t.label, subject: t.subject, filename };
});
for (const [index, t] of templates.entries()) {
  fs.writeFileSync(
    path.join(directory, manifest[index].filename),
    await format(markup(t, manifest[index].kind === 'notification'), formatting),
  );
}
fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const fragment =
  '# Email content only; security notification toggles are intentionally undeclared.\n' +
  manifest
    .map(
      (t) =>
        `[auth.email.${t.kind}.${t.key}]\nsubject = ${JSON.stringify(t.subject)}\ncontent_path = "./supabase/templates/${t.filename}"\n`,
    )
    .join('\n');
fs.writeFileSync(path.join(directory, 'config.fragment.toml'), fragment);
const previewData = manifest.map((t) => ({
  ...t,
  html: fs.readFileSync(path.join(directory, t.filename), 'utf8'),
}));
const preview = `<!doctype html><html lang="id"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Preview email Masuk Saku</title><style>
*{box-sizing:border-box}body{margin:0;background:#f2f3f5;font:15px/1.6 Arial,Helvetica,sans-serif;color:#202126}main{max-width:1220px;margin:auto;padding:32px 20px}h1{font-size:32px;line-height:1.2;margin:6px 0 12px;letter-spacing:-1px}.tag{font-size:12px;font-weight:bold;color:#59662e}.layout{display:grid;grid-template-columns:340px 1fr;gap:24px;margin-top:28px}.panel{padding:24px;border-radius:20px;background:white;border:1px solid #e4e6e9}label{display:block;font-weight:bold;margin:16px 0 6px}select,input,textarea{width:100%;padding:12px;border:1px solid #dfe2e6;border-radius:10px;font:inherit;color:#202126;background:white}textarea{height:190px;font:12px/1.5 monospace;resize:vertical}button{border:0;border-radius:10px;background:#202126;color:white;padding:12px 16px;font-weight:bold;cursor:pointer;margin-top:12px}.muted{color:#69717d;font-size:13px}iframe{width:100%;height:900px;border:0;border-radius:20px;background:#f2f3f5}button:focus-visible,select:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #8a9d4d;outline-offset:2px}@media(max-width:800px){main{padding:24px 12px}.layout{grid-template-columns:1fr}.panel{padding:20px}h1{font-size:28px}}
</style></head><body><main><div class="tag">MASUK SAKU / EMAIL</div><h1>Email yang terasa seperti aplikasimu.</h1><p>13 template autentikasi dan keamanan, siap untuk Supabase.</p><p class="muted">Preview menggunakan data contoh. Tidak ada email yang dikirim atau tautan akun nyata di halaman ini.</p><div class="layout"><section class="panel"><label for="template">Jenis email</label><select id="template"></select><label for="subject">Subject untuk Supabase</label><input id="subject" readonly /><button id="copy-subject" type="button">Salin subject</button><label for="content">Body HTML asli</label><textarea id="content" readonly spellcheck="false"></textarea><button id="copy-content" type="button">Salin HTML</button><p id="status" role="status" class="muted"></p><p class="muted">Di Supabase: Authentication → Email → Templates. Pilih jenis email yang sesuai, lalu tempel subject dan HTML. Template keamanan tidak mengubah status toggle.</p></section><iframe id="preview" title="Pratinjau email dengan data contoh" sandbox=""></iframe></div></main>
<script id="email-data" type="application/json">${JSON.stringify(previewData).replaceAll('<', '\\u003c')}</script><script>
const templates=JSON.parse(document.getElementById('email-data').textContent);
const samples={SiteURL:'https://example.invalid',ConfirmationURL:'https://example.invalid/verify?token=DEMO_ONLY&type=signup',Token:'12345678',NewEmail:'email.baru@example.invalid',OldEmail:'email.lama@example.invalid',Email:'email.baru@example.invalid',OldPhone:'+62 812 0000 0000',Phone:'+62 813 0000 0000',Provider:'Google',FactorType:'TOTP'};
const select=document.getElementById('template');for(const t of templates){const option=document.createElement('option');option.value=t.key;option.textContent=t.label;select.append(option)}
function show(){const t=templates.find(t=>t.key===select.value);document.getElementById('subject').value=t.subject;document.getElementById('content').value=t.html;document.getElementById('preview').srcdoc=t.html.replace(/{{\\s*\\.(\\w+)\\s*}}/g,(_,key)=>samples[key]||'DATA CONTOH');document.getElementById('status').textContent=''}
async function copy(id){const field=document.getElementById(id);try{await navigator.clipboard.writeText(field.value);document.getElementById('status').textContent='Berhasil disalin.'}catch{field.focus();field.select();document.getElementById('status').textContent='Tekan Ctrl+C untuk menyalin teks yang dipilih.'}}
select.addEventListener('change',show);document.getElementById('copy-subject').addEventListener('click',()=>copy('subject'));document.getElementById('copy-content').addEventListener('click',()=>copy('content'));show();
</script></body></html>`;
fs.writeFileSync(path.join(directory, 'preview.html'), await format(preview, formatting));
console.log(`Created ${manifest.length} Indonesian Supabase email templates.`);
