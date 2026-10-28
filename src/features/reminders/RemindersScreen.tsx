import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/Card';
import { Loading } from '@/components/Loading';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { CheckIcon, InfoIcon } from '@/components/icons';
import { useAsync } from '@/hooks/useAsync';
import { announceRemindersChanged, REMINDERS_CHANGED } from '@/lib/reminderEvents';
import { sortReminders } from '@/lib/reminders';
import { reminders } from '@/lib/storage';
import type { Reminder } from '@/types';
import { NotificationPermissionCard } from './NotificationPermissionCard';
import { ReminderCard } from './ReminderCard';
import { WarrantForm } from './WarrantForm';

export default function RemindersScreen() {
  const { t } = useTranslation();
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState<null | 'saved' | 'failed'>(null);
  const data = useAsync(() => reminders.list(), [version]);

  // Refresh when alerts are shown or reminders change elsewhere.
  useEffect(() => {
    const onChange = () => setVersion((v) => v + 1);
    window.addEventListener(REMINDERS_CHANGED, onChange);
    return () => window.removeEventListener(REMINDERS_CHANGED, onChange);
  }, []);

  const save = async (r: Reminder) => {
    try {
      await reminders.put(r);
      setStatus('saved');
      announceRemindersChanged();
      return true;
    } catch {
      setStatus('failed');
      return false;
    }
  };
  const remove = async (id: string) => {
    try {
      await reminders.remove(id);
      announceRemindersChanged();
    } catch {
      setStatus('failed');
    }
  };

  const list = data.status === 'ready' ? data.data : data.status === 'loading' ? data.stale : undefined;
  const { upcoming, done } = sortReminders(list ?? []);

  return (
    <>
      <PageHeader title={t('screens.reminders')} />
      <div className="mx-auto grid max-w-2xl gap-4 p-4">
        <p>{t('reminders.intro')}</p>
        <NotificationPermissionCard />
        <p className="flex items-start gap-2 text-sm">
          <InfoIcon className="mt-0.5 shrink-0 text-accent" />
          <span>{t('reminders.how')}</span>
        </p>

        {!list && data.status === 'loading' && <Loading />}
        {data.status === 'error' && <Notice tone="danger">{t('tickets.listError')}</Notice>}
        {list && list.length === 0 && (
          <Notice title={t('reminders.empty')}>{t('reminders.emptyHint')}</Notice>
        )}
        {[
          { key: 'upcoming', title: t('reminders.upcoming'), items: upcoming },
          { key: 'done', title: t('reminders.done'), items: done },
        ]
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <section key={g.key} aria-labelledby={`rem-${g.key}`} className="grid gap-3">
              <h2 id={`rem-${g.key}`} className="text-lg font-bold">
                {g.title}
              </h2>
              {g.items.map((r) => (
                <ReminderCard key={r.id} reminder={r} onDelete={remove} />
              ))}
            </section>
          ))}

        <Card>
          {status === 'saved' && (
            <p role="status" className="mb-3 flex items-center gap-2 font-semibold text-ok">
              <CheckIcon className="shrink-0" />
              {t('reminders.saved')}
            </p>
          )}
          {status === 'failed' && (
            <Notice tone="danger">
              <span role="alert">{t('reminders.saveFailed')}</span>
            </Notice>
          )}
          <WarrantForm onSave={save} />
        </Card>
      </div>
    </>
  );
}
