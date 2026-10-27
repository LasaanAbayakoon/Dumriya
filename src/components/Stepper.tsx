import { useId, useState } from 'react';
import { PlusIcon } from './icons';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
};

/** Number input with large − / + buttons (44px targets). */
export function Stepper({ label, value, min, max, onChange, decreaseLabel, increaseLabel }: Props) {
  const id = useId();
  // While typing, the field may be empty or out of range; it is tidied on blur.
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (n: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? Math.round(n) : min));
  const step = (by: number) => {
    setDraft(null);
    onChange(clamp(value + by));
  };
  const btn =
    'tap inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-accent hover:bg-accent-soft disabled:opacity-40';
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-muted">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} aria-label={decreaseLabel} disabled={value <= min} onClick={() => step(-1)}>
          <svg viewBox="0 0 24 24" width="1.5em" height="1.5em" aria-hidden="true" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M5 12h14" />
          </svg>
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft ?? String(value)}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = e.target.valueAsNumber;
            if (Number.isFinite(n) && n >= min) onChange(clamp(n));
          }}
          onBlur={() => setDraft(null)}
          className="tap w-20 rounded-xl border border-border bg-surface px-2 py-2 text-center text-xl font-bold tabular"
        />
        <button type="button" className={btn} aria-label={increaseLabel} disabled={value >= max} onClick={() => step(1)}>
          <PlusIcon />
        </button>
      </div>
    </div>
  );
}
