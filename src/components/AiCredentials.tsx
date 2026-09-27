import { useEffect, useState } from 'react';
import { configured } from '../lib/supabase';
import {
  getMyAiCredentialStatus,
  revokeMyAiCredential,
  saveAiKey,
  type AiCredentialStatus,
} from '../lib/repository';

export function AiCredentials({ household }: { household: string }) {
  const [status, setStatus] = useState<AiCredentialStatus | null>(null),
    [key, setKey] = useState(''),
    [busy, setBusy] = useState(configured),
    [loaded, setLoaded] = useState(false),
    [confirm, setConfirm] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    if (!configured) return;
    setBusy(true);
    setError('');
    setLoaded(false);
    getMyAiCredentialStatus(household)
      .then((value) => {
        if (active) {
          setStatus(value);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) setError('Status kunci belum bisa dimuat. Coba lagi.');
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [household, retry]);
  return (
    <div>
      {loaded && (
        <p>
          <strong>{status ? 'Kunci akunmu tersimpan' : 'Belum ada kunci untuk akunmu'}</strong>
        </p>
      )}
      {status && (
        <p className="muted">
          {status.provider} · {status.model}. Kunci milik akunmu, terpisah dari anggota lain.
        </p>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          const ephemeral = key;
          setKey('');
          setBusy(true);
          setError('');
          setMessage('');
          try {
            await saveAiKey(household, ephemeral);
            setStatus(await getMyAiCredentialStatus(household));
            setLoaded(true);
            setMessage('Kunci disimpan terenkripsi. Kunci sebelumnya telah diganti.');
            setConfirm(false);
          } catch {
            setError('Permintaan belum berhasil. Masukkan kembali kunci untuk mencoba lagi.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Endpoint AI
          <input
            type="url"
            readOnly
            value="https://openrouter.ai/api/v1/chat/completions"
            aria-describedby="ai-endpoint-help"
          />
        </label>
        <small id="ai-endpoint-help">
          Endpoint OpenRouter sudah diatur otomatis. Cukup masukkan API key OpenRouter milikmu.
        </small>
        <label>
          API key OpenRouter
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
            minLength={16}
            maxLength={512}
            required
            disabled={busy || !configured}
          />
        </label>
        <button className="primary" disabled={busy || !configured}>
          Simpan kunci terenkripsi
        </button>
      </form>
      {status && !confirm && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setConfirm(true);
            setMessage('');
            setError('');
          }}
        >
          Cabut kunci AI
        </button>
      )}
      {confirm && (
        <div className="warning">
          <p>
            Cabut kunci akunmu dari aplikasi? AI tidak bisa membuat preview baru sampai kunci
            dipasang kembali. Transaksi yang sudah dicatat tetap tersimpan. Kunci di OpenRouter
            tidak ikut dihapus.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (busy) return;
              setBusy(true);
              setError('');
              try {
                await revokeMyAiCredential(household);
                setStatus(null);
                setConfirm(false);
                setMessage('Kunci akunmu dicabut dari aplikasi.');
              } catch {
                setError('Permintaan belum berhasil. Coba lagi.');
              } finally {
                setBusy(false);
              }
            }}
          >
            Ya, cabut kunci akun saya
          </button>
          <button type="button" disabled={busy} onClick={() => setConfirm(false)}>
            Batal
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="success">
          {message}
        </p>
      )}
      {!loaded && configured && !busy && (
        <button type="button" onClick={() => setRetry(retry + 1)}>
          Muat ulang status
        </button>
      )}
    </div>
  );
}
