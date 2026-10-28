import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { BellIcon, CloseIcon } from '@/components/icons';
import { LATE_ALERT_MINUTES, REMINDER_CHECK_INTERVAL_MS } from '@/config/app';
import { useFormat } from '@/hooks/useFormat';
import { showSystemNotification } from '@/lib/notify';
import { announceRemindersChanged, REMINDERS_CHANGED } from '@/lib/reminderEvents';
import { dueAlerts, markFired } from '@/lib/reminders';
import { reminders } from '@/lib/storage';
import type { Reminder } from '@/types';
import { useStations } from '@/hooks/useStations';
import { useAlertText } from './useAlertText';

interface Shown {
  key: string;
  title: string;
  /** Set when the alert is shown well after its time (the app was closed). */
  dueAt?: string;
}

/**
 * Fires due reminder alerts while the app is open: on start, every 30 s, when the app
 * comes back to the foreground, and when reminders change. Each alert is shown once, as a
 * phone notification if allowed AND always as an in-app banner, then marked as shown.
 */
export function ReminderScheduler() {
  const { t } = useTranslation();
  const f = useFormat();
  const alertText = useAlertText();
  const textRef = useRef(alertText);
  const titleRef = useRef(t('reminders.inAppTitle'));
  const [shown, setShown] = useState<Shown[]>([]);
  // Alert texts can name stations: start checking once the station list is loaded.
  const ready = useStations() !== null;

  useEffect(() => {
    textRef.current = alertText;
    titleRef.current = t('reminders.inAppTitle');
  }, [alertText, t]);

  useEffect(() => {
    if (!ready) return;
    let stopped = false;
    let running = false;

    const check = async () => {
      if (running) return; // never fire the same alert twice from overlapping checks
      running = true;
      try {
        const list = await reminders.list();
        const now = new Date();
        const due = dueAlerts(list, now);
        if (due.length === 0) return;
        const updated = new Map<string, Reminder>();
        const fresh: Shown[] = [];
        for (const d of due) {
          const current = updated.get(d.reminder.id) ?? d.reminder;
          const { title } = textRef.current(current, d.alert);
          const key = `${current.id}-${d.index}`;
          const late = now.getTime() - Date.parse(d.alert.at) > LATE_ALERT_MINUTES * 60_000;
          await showSystemNotification(titleRef.current, title, key);
          fresh.push({ key, title, ...(late ? { dueAt: d.alert.at } : {}) });
          updated.set(current.id, markFired(current, d.index, now));
        }
        await Promise.all([...updated.values()].map((r) => reminders.put(r)));
        if (!stopped) setShown((s) => [...s, ...fresh]);
        announceRemindersChanged();
      } catch {
        /* storage blocked: nothing to fire */
      } finally {
        running = false;
      }
    };

    void check();
    const id = setInterval(() => void check(), REMINDER_CHECK_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener(REMINDERS_CHANGED, onVisible);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener(REMINDERS_CHANGED, onVisible);
    };
  }, [ready]);

  if (shown.length === 0) return null;
  return (
    // In normal flow (not sticky), so it never covers the page header or back button.
    <div className="grid gap-2 p-2" data-testid="in-app-alerts">
      {shown.map((s) => (
        <div key={s.key} role="alert" className="mx-auto flex w-full max-w-2xl items-start gap-3 rounded-xl border border-accent bg-accent-soft p-3 shadow">
          <BellIcon className="mt-0.5 shrink-0 text-accent" />
          <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
            <p className="font-bold">{t('reminders.inAppTitle')}</p>
            <p>{s.title}</p>
            {s.dueAt && <p className="text-sm text-muted">{t('reminders.lateNote', { when: f.dateTime(s.dueAt) })}</p>}
            <Link to="/reminders" className="text-sm font-semibold text-accent underline">
              {t('screens.reminders')}
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setShown((list) => list.filter((x) => x.key !== s.key))}
            className="tap -m-2 inline-flex shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2"
          >
            <CloseIcon title={t('reminders.dismiss')} />
          </button>
        </div>
      ))}
    </div>
  );
}
