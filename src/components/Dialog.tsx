import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from './icons';

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Full-screen on phones (for pickers); otherwise a bottom sheet. */
  fullScreen?: boolean;
  /** Element to focus first; defaults to the first focusable element. */
  initialFocus?: React.RefObject<HTMLElement | null>;
};

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

/** Accessible modal: labelled, traps focus, closes on Escape, restores focus on close. */
export function Dialog({ title, onClose, children, fullScreen, initialFocus }: Props) {
  const { t } = useTranslation();
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const first = initialFocus?.current ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === 'Tab' && panel.current) {
        const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (items.length === 0) return;
        const [head, tail] = [items[0]!, items[items.length - 1]!];
        if (e.shiftKey && document.activeElement === head) {
          e.preventDefault();
          tail.focus();
        } else if (!e.shiftKey && document.activeElement === tail) {
          e.preventDefault();
          head.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [initialFocus]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full max-w-2xl flex-col bg-surface shadow-xl ${
          fullScreen ? 'h-dvh sm:h-[85dvh] sm:rounded-2xl' : 'max-h-[90dvh] rounded-t-2xl sm:rounded-2xl'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <h2 id={titleId} className="min-w-0 flex-1 text-lg font-bold [overflow-wrap:anywhere]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="tap -mr-2 inline-flex items-center justify-center rounded-full text-muted hover:bg-surface-2"
          >
            <CloseIcon title={t('common.close')} />
          </button>
        </div>
        <div className="pb-safe min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
