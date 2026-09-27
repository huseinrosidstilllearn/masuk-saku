import { useId } from 'react';
import { useMotionDialog } from '../lib/motion';
import { Icon, type IconName } from './Icon';

export type CaptureMode = 'upload' | 'camera' | 'manual';
const choices: { mode: CaptureMode; title: string; description: string; icon: IconName }[] = [
  {
    mode: 'upload',
    title: 'Upload struk',
    description: 'Pilih gambar dari perangkatmu.',
    icon: 'upload',
  },
  {
    mode: 'camera',
    title: 'Foto struk',
    description: 'Buka kamera dan ambil foto struk.',
    icon: 'camera',
  },
  {
    mode: 'manual',
    title: 'Tambah manual',
    description: 'Isi transaksi tanpa bantuan AI.',
    icon: 'edit',
  },
];

export function CaptureChoices({
  onSelect,
  onClose,
}: {
  onSelect: (mode: CaptureMode) => void;
  onClose: () => void;
}) {
  const id = useId();
  const { ref, close } = useMotionDialog(onClose);
  return (
    <dialog
      ref={ref}
      className="capture-choices"
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="modal-head">
        <div>
          <span className="eyebrow">CATAT DENGAN CARAMU</span>
          <h2 id={id}>Tambah transaksi</h2>
        </div>
        <button type="button" aria-label="Tutup pilihan transaksi" onClick={() => close()}>
          <Icon name="close" />
        </button>
      </div>
      <p>AI membantu membaca struk. Kamu periksa dan konfirmasi sebelum transaksi disimpan.</p>
      <div className="capture-options">
        {choices.map((choice) => (
          <button
            type="button"
            key={choice.mode}
            onClick={() => close(() => onSelect(choice.mode))}
          >
            <span className={`capture-option-icon ${choice.mode}`}>
              <Icon name={choice.icon} />
            </span>
            <span>
              <strong>{choice.title}</strong>
              <small>{choice.description}</small>
            </span>
            <Icon name="chevronRight" />
          </button>
        ))}
      </div>
    </dialog>
  );
}
