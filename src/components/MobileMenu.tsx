import { useMotionDialog } from '../lib/motion';
import { Icon, type IconName } from './Icon';

export function MobileMenu<T extends string>({
  items,
  current,
  onSelect,
  onClose,
}: {
  items: { id: T; label: string; icon: IconName }[];
  current: T;
  onSelect: (id: T) => void;
  onClose: () => void;
}) {
  const { ref, close: dismiss } = useMotionDialog(onClose);
  function close() {
    dismiss();
  }
  return (
    <dialog
      ref={ref}
      className="navigation-dialog"
      aria-labelledby="menu-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="modal-head">
        <div>
          <span className="eyebrow">SAKU KELUARGA</span>
          <h2 id="menu-title">Menu lainnya</h2>
        </div>
        <button type="button" aria-label="Tutup menu" onClick={close}>
          <Icon name="close" />
        </button>
      </div>
      <p className="menu-description">
        Rencana tabungan, catatan yang dihapus, dan preferensi keluarga.
      </p>
      <div className="navigation-options">
        {items.map((item) => (
          <button
            key={item.id}
            aria-current={item.id === current ? 'page' : undefined}
            onClick={() => {
              dismiss(() => {
                onClose();
                onSelect(item.id);
              });
            }}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            <Icon name="chevronRight" />
          </button>
        ))}
      </div>
    </dialog>
  );
}
