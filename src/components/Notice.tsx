import type { ReactNode } from 'react';
import { AlertIcon, InfoIcon } from './icons';

type Tone = 'info' | 'warn' | 'danger';

const tones: Record<Tone, string> = {
  info: 'bg-accent-soft text-text border-accent/30',
  warn: 'bg-warn-soft text-text border-warn/40',
  danger: 'bg-danger-soft text-text border-danger/40',
};
const iconTone: Record<Tone, string> = { info: 'text-accent', warn: 'text-warn', danger: 'text-danger' };

/**
 * A short message in plain words. The icon is decorative only: the text must
 * carry the full meaning (e.g. "Not confirmed"), so nothing relies on the icon.
 */
export function Notice({ tone = 'info', title, children }: { tone?: Tone; title?: string; children: ReactNode }) {
  const Icon = tone === 'info' ? InfoIcon : AlertIcon;
  return (
    <div className={`flex gap-3 rounded-xl border p-3 ${tones[tone]}`}>
      <Icon className={`mt-0.5 shrink-0 ${iconTone[tone]}`} />
      <div className="min-w-0 [overflow-wrap:anywhere]">
        {title && <p className="font-bold">{title}</p>}
        <div className="text-[0.95rem]">{children}</div>
      </div>
    </div>
  );
}
