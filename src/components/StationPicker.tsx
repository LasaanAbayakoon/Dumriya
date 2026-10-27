import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { searchStations } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useFormat } from '@/hooks/useFormat';
import type { Station } from '@/types';
import { Dialog } from './Dialog';
import { PinIcon } from './icons';

type Props = {
  label: string;
  dialogTitle: string;
  value: Station | null;
  onChange: (station: Station) => void;
  error?: string;
  id?: string;
};

/** A field that opens a full-screen, searchable station list (English, Sinhala, Tamil names and codes). */
export function StationPicker({ label, dialogTitle, value, onChange, error, id }: Props) {
  const { t } = useTranslation();
  const f = useFormat();
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [open, setOpen] = useState(false);

  return (
    <div>
      <span id={`${fieldId}-label`} className="mb-1 block text-sm font-semibold text-muted">
        {label}
      </span>
      <button
        id={fieldId}
        type="button"
        aria-labelledby={`${fieldId}-label ${fieldId}`}
        aria-haspopup="dialog"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        onClick={() => setOpen(true)}
        className={`tap flex w-full items-center gap-2 rounded-xl border bg-surface px-3 py-2 text-left text-lg ${
          error ? 'border-danger' : 'border-border'
        }`}
      >
        <PinIcon className="shrink-0 text-muted" />
        <span className={`min-w-0 flex-1 [overflow-wrap:anywhere] ${value ? 'font-semibold' : 'text-muted'}`}>
          {value ? f.station(value) : t('home.chooseStation')}
        </span>
      </button>
      {error && (
        <p id={`${fieldId}-error`} className="mt-1 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      {open && (
        <StationSearchDialog
          title={dialogTitle}
          onClose={() => setOpen(false)}
          onPick={(s) => {
            onChange(s);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function StationSearchDialog({ title, onClose, onPick }: { title: string; onClose: () => void; onPick: (s: Station) => void }) {
  const { t } = useTranslation();
  const f = useFormat();
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const results = useAsync(() => searchStations(query), [query]);
  const list = results.status === 'ready' ? results.data : results.status === 'loading' ? results.stale : undefined;
  const others = (s: Station) => (['en', 'si', 'ta'] as const).filter((l) => l !== f.lng).map((l) => s.name[l]);

  return (
    <Dialog title={title} onClose={onClose} fullScreen initialFocus={input}>
      <div className="sticky top-0 bg-surface p-4 pb-2">
        <label htmlFor={`${hintId}-q`} className="mb-1 block font-semibold">
          {t('picker.searchLabel')}
        </label>
        <input
          ref={input}
          id={`${hintId}-q`}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-describedby={hintId}
          autoComplete="off"
          className="tap w-full rounded-xl border border-border bg-bg px-3 py-2 text-lg"
        />
        <p id={hintId} className="mt-1 text-sm text-muted">
          {t('picker.searchHint')}
        </p>
      </div>
      <div aria-live="polite">
        {list && list.length === 0 && (
          <p className="p-4 text-muted">{t('picker.noResults', { query })}</p>
        )}
        {list && list.length > 0 && (
          <ul className="divide-y divide-border">
            {list.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onPick(s)}
                  className="tap flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-surface-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold [overflow-wrap:anywhere]">{f.station(s)}</span>
                    <span className="block text-sm text-muted [overflow-wrap:anywhere]">{others(s).join(' · ')}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-surface-2 px-2 py-0.5 text-sm font-semibold text-muted">{s.code}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
