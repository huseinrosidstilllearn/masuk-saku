import { useLayoutEffect, useRef, useState } from 'react';

export function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Read the recipe's clock so lifecycle cleanup follows the CSS, including reduced motion. */
export function motionDuration(token: string) {
  if (reducedMotion()) return 0;
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const number = parseFloat(value);
  return Number.isFinite(number) ? number * (value.endsWith('ms') ? 1 : 1000) : 0;
}

/** Transitions.dev modal orchestration adapted to native dialog and React cleanup. */
export function useMotionDialog(onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const callback = useRef(onClose);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closing = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  useLayoutEffect(() => {
    callback.current = onClose;
  }, [onClose]);
  useLayoutEffect(() => {
    const dialog = ref.current!;
    const trigger = document.activeElement as HTMLElement | null;
    dialog.classList.add('t-modal');
    dialog.classList.remove('is-closing', 'is-open');
    dialog.inert = false;
    closing.current = false;
    dialog.showModal();
    void dialog.offsetWidth;
    dialog.classList.add('is-open');
    return () => {
      clearTimeout(timer.current);
      dialog.close();
      if (trigger?.isConnected && !document.querySelector('dialog[open]')) trigger.focus();
    };
  }, []);

  function close(after?: () => void) {
    const dialog = ref.current;
    if (!dialog || closing.current) return;
    closing.current = true;
    setIsClosing(true);
    // No further submit/click can occur while the surface exits. Keep native focus trap until close.
    dialog.inert = true;
    dialog.classList.remove('is-open');
    dialog.classList.add('is-closing');
    const finish = () => {
      dialog.close();
      dialog.classList.remove('is-closing');
      (after ?? callback.current)();
    };
    const duration = motionDuration('--modal-close-dur');
    if (duration) timer.current = setTimeout(finish, duration);
    else finish();
  }
  return { ref, close, isClosing };
}
