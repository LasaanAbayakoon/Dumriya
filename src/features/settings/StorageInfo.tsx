import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { useAsync } from '@/hooks/useAsync';
import { isPersisted, requestPersistence, storageEstimate, tickets } from '@/lib/storage';
import { formatBytes, ticketsSize } from '@/lib/tickets';

/** Storage used and whether the browser agreed to keep the data (shown next to "Delete all my data"). */
export function StorageInfo({ version }: { version: number }) {
  const { t } = useTranslation();
  const [attempt, setAttempt] = useState(0);
  const [refused, setRefused] = useState(false);
  const info = useAsync(async () => {
    const [list, estimate, persisted] = await Promise.all([tickets.list().catch(() => []), storageEstimate(), isPersisted()]);
    return { size: ticketsSize(list), estimate, persisted };
  }, [version, attempt]);

  const protect = async () => {
    const ok = await requestPersistence();
    setRefused(!ok);
    setAttempt((n) => n + 1);
  };

  if (info.status !== 'ready') return null;
  const { size, estimate, persisted } = info.data;
  return (
    <div className="grid gap-1 rounded-xl bg-surface-2 p-3 text-sm" aria-labelledby="storage-title">
      <h3 id="storage-title" className="font-semibold">
        {t('settings.storageTitle')}
      </h3>
      <p data-testid="settings-usage">{t('tickets.usage', { size: formatBytes(size) })}</p>
      {estimate && <p>{t('tickets.quota', { used: formatBytes(estimate.usage), quota: formatBytes(estimate.quota) })}</p>}
      {persisted !== null && <p data-testid="settings-persisted">{persisted ? t('tickets.persisted') : t('tickets.notPersisted')}</p>}
      {persisted === false && (
        <Button variant="secondary" className="mt-1" onClick={() => void protect()}>
          {t('settings.protect')}
        </Button>
      )}
      {refused && <p role="status">{t('settings.protectRefused')}</p>}
    </div>
  );
}
