import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';

const ITEMS = ['book.checkId', 'book.checkTransfer', 'book.checkGate', 'book.checkEmail', 'book.checkPayment'] as const;

/** A self-check, not a gate: ticking items is optional and never blocks the official site. */
export function Checklist() {
  const { t } = useTranslation();
  const [done, setDone] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <Card>
      <section aria-labelledby="check-title" className="grid gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="check-title" className="text-lg font-bold">
            {t('book.checklistTitle')}
          </h2>
          <p className="text-sm text-muted" aria-live="polite">
            {t('book.checklistProgress', { done: done.size, total: ITEMS.length })}
          </p>
        </div>
        <ul className="grid gap-2">
          {ITEMS.map((k) => (
            <li key={k}>
              <label className="flex items-start gap-3 rounded-xl border border-border p-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                <input
                  type="checkbox"
                  checked={done.has(k)}
                  onChange={() => toggle(k)}
                  className="mt-1 size-5 shrink-0 accent-[var(--accent)]"
                />
                <span className="[overflow-wrap:anywhere]">{t(k)}</span>
              </label>
            </li>
          ))}
        </ul>
        <Notice tone="warn" title={t('book.emailTitle')}>
          {t('book.emailBody')}
        </Notice>
      </section>
    </Card>
  );
}
