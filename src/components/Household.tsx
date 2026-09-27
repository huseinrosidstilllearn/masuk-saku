import { useEffect, useState } from 'react';
import type { Snapshot } from '../domain/types';
import {
  createInvitation,
  invitationCode,
  listInvitations,
  revokeInvitation,
  type Invitation,
} from '../lib/invitations';
import { EditorDialog } from './Planning';
import { Icon } from './Icon';
import { configured } from '../lib/supabase';
import { revokeHouseholdMember } from '../lib/invitations';

const labels = {
  pending: 'Menunggu',
  accepted: 'Bergabung',
  revoked: 'Dibatalkan',
  expired: 'Kedaluwarsa',
};
export function HouseholdManager({
  data,
  isOwner,
  onSaved,
  initialInvite = false,
  onInviteHandled,
}: {
  data: Snapshot;
  isOwner: boolean;
  onSaved?: () => Promise<void>;
  initialInvite?: boolean;
  onInviteHandled?: () => void;
}) {
  const [revoking, setRevoking] = useState<Snapshot['members'][number] | null>(null);
  const [rows, setRows] = useState<Invitation[]>([]);
  const [editor, setEditor] = useState(initialInvite && isOwner);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<{ id: string; email: string; code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (initialInvite && isOwner) {
      setEditor(true);
      onInviteHandled?.();
    }
  }, [initialInvite, isOwner, onInviteHandled]);
  useEffect(() => {
    let active = true;
    setRows([]);
    setError('');
    if (isOwner)
      listInvitations(data.household.id)
        .then((next) => {
          if (active) setRows(next);
        })
        .catch((e) => {
          if (active) setError(e instanceof Error ? e.message : 'Gagal memuat undangan.');
        });
    return () => {
      active = false;
    };
  }, [data.household.id, isOwner]);
  async function revoke(row: Invitation) {
    if (!window.confirm(`Batalkan undangan untuk ${row.email}?`)) return;
    setBusy(true);
    setError('');
    try {
      await revokeInvitation(row.id);
      if (issued?.id === row.id) setIssued(null);
      setRows(await listInvitations(data.household.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membatalkan undangan.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel household-panel">
      <div className="catalog-heading">
        <h2>Anggota keluarga</h2>
        {isOwner && (
          <button disabled={busy} onClick={() => setEditor(true)}>
            <Icon name="plus" />
            Undang anggota
          </button>
        )}
      </div>
      <p>
        Semua anggota dapat melihat dompet dan transaksi keluarga. Anggota baru mendapat peran
        Member.
      </p>
      {data.members.map((member) => (
        <div className="catalog-row" key={member.user_id}>
          <strong>{member.display_name}</strong>
          <span>
            {member.role === 'owner' ? 'Owner' : 'Member'}
            {member.active === false ? ' · Nonaktif' : ''}
          </span>
          {isOwner && member.role === 'member' && member.active !== false && (
            <button
              disabled={busy || !configured}
              aria-label={'Nonaktifkan akses ' + member.display_name}
              onClick={() => setRevoking(member)}
            >
              Nonaktifkan akses
            </button>
          )}
        </div>
      ))}
      {isOwner && (
        <>
          <h3>Undangan</h3>
          <p>
            Kirim kode secara manual kepada email tujuan. Berlaku tujuh hari; penerima perlu login
            dan memverifikasi email. Kode tidak dikirim otomatis.
          </p>
          {error && <p role="alert">{error}</p>}
          {issued && (
            <div className="invite-code-card">
              <h3>Kode untuk {issued.email}</h3>
              <p>
                Simpan sekarang. Kode tidak dapat dibaca kembali setelah meninggalkan halaman ini.
              </p>
              <label>
                Kode undangan
                <input
                  readOnly
                  value={issued.code}
                  onFocus={(e) => e.currentTarget.select()}
                  autoComplete="off"
                />
              </label>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(issued.code);
                    setCopied(true);
                  } catch {
                    setError('Salin kode dari kolom di atas secara manual.');
                  }
                }}
              >
                <Icon name="copy" />
                {copied ? 'Kode disalin' : 'Salin kode'}
              </button>
            </div>
          )}
          {!rows.length && <p>Belum ada undangan.</p>}
          {rows.map((row) => (
            <div className="invitation-row" key={row.id}>
              <div>
                <strong>{row.email}</strong>
                <small>
                  {labels[row.status]} · Berlaku sampai{' '}
                  {new Date(row.expires_at).toLocaleDateString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                  })}
                </small>
              </div>
              {row.status === 'pending' && (
                <button
                  disabled={busy}
                  onClick={() => revoke(row)}
                  aria-label={`Batalkan undangan ${row.email}`}
                >
                  <Icon name="close" />
                  Batalkan
                </button>
              )}
            </div>
          ))}
        </>
      )}
      {editor && (
        <InviteEditor
          household={data.household.id}
          onClose={() => setEditor(false)}
          onIssued={async (value) => {
            setIssued(value);
            setCopied(false);
            try {
              setRows(await listInvitations(data.household.id));
            } catch {
              setError('Kode sudah dibuat; daftar undangan belum dapat dimuat ulang.');
            }
          }}
        />
      )}
      {revoking && (
        <EditorDialog
          title="Nonaktifkan akses anggota"
          submitLabel="Ya, nonaktifkan akses"
          onClose={() => setRevoking(null)}
          onSave={async () => {
            await revokeHouseholdMember(data.household.id, revoking.user_id);
            await onSaved?.();
          }}
        >
          <p>
            Nonaktifkan akses {revoking.display_name}? Riwayat transaksi dan dompet tetap tersimpan.
            Anggota tidak bisa membaca atau mencatat data keluarga lagi.
          </p>
          <p>
            Kode undangan lama tidak dapat dipakai kembali. Buat undangan baru jika ingin
            mengaktifkan akses lagi. Data yang sudah pernah dilihat tidak bisa ditarik kembali dari
            perangkat penerima.
          </p>
        </EditorDialog>
      )}
    </section>
  );
}

function InviteEditor({
  household,
  onClose,
  onIssued,
}: {
  household: string;
  onClose: () => void;
  onIssued: (value: { id: string; email: string; code: string }) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [request] = useState(() => ({ id: crypto.randomUUID(), code: invitationCode() }));
  return (
    <EditorDialog
      title="Undang anggota keluarga"
      onClose={onClose}
      submitLabel="Buat kode undangan"
      note="Penerima akan mendapat akses ke keuangan keluarga setelah menerima undangan."
      onSave={async () => {
        await createInvitation(household, email, request.id, request.code);
        await onIssued({ ...request, email: email.trim().toLowerCase() });
      }}
    >
      <label>
        Email penerima
        <input
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </label>
      <p>Kode hanya berlaku untuk akun dengan email ini. Bagikan kode langsung kepada penerima.</p>
    </EditorDialog>
  );
}
