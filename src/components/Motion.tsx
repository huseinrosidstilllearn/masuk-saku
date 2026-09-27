import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { motionDuration } from '../lib/motion';
import { Icon } from './Icon';

export function MotionLoadingText({ text }: { text: string }) {
  return (
    <span>
      <span className="t-shimmer" data-text={text} aria-hidden="true">
        {text}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

/** Replay the incoming page recipe without retaining an outgoing financial snapshot. */
export function MotionPage({ page, children }: { page: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const slider = ref.current!;
    slider.dataset.page = '1';
    void slider.offsetWidth;
    slider.dataset.page = '2';
  }, [page]);
  return (
    <div
      ref={ref}
      className="t-page-slide workspace-content"
      data-page="2"
      data-content-page={page}
    >
      <div className="t-page" data-page-id="2">
        {children}
      </div>
    </div>
  );
}

export function MotionNotice({
  text,
  kind,
  onDismiss,
}: {
  text: string;
  kind: 'success' | 'error';
  onDismiss: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closing = useRef(false);
  useLayoutEffect(() => {
    const toast = ref.current!;
    toast.classList.remove('is-open');
    void toast.offsetWidth;
    toast.classList.add('is-open');
    return () => clearTimeout(timer.current);
  }, []);
  function dismiss() {
    if (closing.current) return;
    closing.current = true;
    const toast = ref.current!;
    const restoreFocus = toast.contains(document.activeElement);
    toast.inert = true;
    toast.classList.remove('is-open');
    const finish = () => {
      if (
        restoreFocus &&
        (document.activeElement === document.body || toast.contains(document.activeElement))
      )
        document.getElementById('main-content')?.focus();
      onDismiss();
    };
    const duration = motionDuration('--toast-close');
    if (duration) timer.current = setTimeout(finish, duration);
    else finish();
  }
  return (
    <div
      ref={ref}
      className={'status-message t-toast ' + kind}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      <Icon name={kind === 'error' ? 'close' : 'check'} />
      <span>{text}</span>
      <button onClick={dismiss} aria-label="Tutup pemberitahuan">
        <Icon name="close" />
      </button>
    </div>
  );
}

export function MotionDisclosure({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="t-acc" data-open={String(open)}>
      <button
        className="t-acc-head"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        {title}
        <span className="t-acc-chevron">
          <Icon name="chevronDown" />
        </span>
      </button>
      <div className="t-acc-panel" id={id} aria-hidden={!open} inert={!open}>
        <div className="t-acc-panel-inner">{children}</div>
      </div>
    </div>
  );
}
