import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Notice } from '@/components/Notice';
import { BellIcon, CheckIcon } from '@/components/icons';
import { BOOKING_MIDNIGHT_ALERT_DEFAULT } from '@/config/app';
import { useFormat } from '@/hooks/useFormat';
import { useNow } from '@/hooks/useNow';
import type { BookingWindow } from '@/lib/bookingWindow';
import { buildIcs, downloadIcs } from '@/lib/ics';
import { bookingOpensReminder, newReminderId, reminderIcsEvents } from '@/lib/reminders';
import { notificationState } from '@/lib/notify';
import { announceRemindersChanged } from '@/lib/reminderEvents';
import { reminders } from '@/lib/storage';
import type { Trip } from '@/types';
import { useAlertText } from '../reminders/useAlertText';

const ALERT_LABEL = { 'heads-up': 'reminder.alertHeadsUp', midnight: 'reminder.alertMidnight', opening: 'reminder.alertOpening' } as const;

export function ReminderSheet({ trip, window, onClose }: { trip: Trip; window: BookingWindow; onClose: () => void }) {
  const { t } = useTranslation();
  const f = useFormat();
  const now = useNow();
  const alertText = useAlertText();
  const [midnight, setMidnight] = useState(BOOKING_MIDNIGHT_ALERT_DEFAULT);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [id] = useState(newReminderId);

  // Stored as data; display text is produced in the current language at alert time.
  const reminder = bookingOpensReminder(trip, window, { midnight, now, id });
  const hasAlerts = reminder.alerts.length > 0;

  const save = async () => {
    try {
      await reminders.put(reminder);
      announceRemindersChanged();
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  const addToCalendar = () => {
    downloadIcs(`dumriya-booking-${trip.train.number}-${trip.date}.ics`, buildIcs(reminderIcsEvents(reminder, alertText)));
  };

  return (
    <Dialog title={t('reminder.title')} onClose={onClose}>
      <div className="grid gap-4 p-4">
        <p className="font-semibold [overflow-wrap:anywhere]">
          {f.train(trip.train)} · {f.date(trip.date)}
        </p>

        {!window.timeConfirmed && (
          <label className="flex items-start gap-3 rounded-xl border border-border p-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
            <input
              type="checkbox"
              checked={midnight}
              onChange={(e) => {
                setMidnight(e.target.checked);
                setSaveState('idle');
              }}
              className="mt-1 size-5 shrink-0 accent-[var(--accent)]"
            />
            <span className="[overflow-wrap:anywhere]">{t('reminder.midnightToggle')}</span>
          </label>
        )}

        {hasAlerts ? (
          <div>
            <p className="mb-1 font-semibold">{t('reminder.intro')}</p>
            <ul className="grid gap-1">
              {reminder.alerts.map((a) => (
                <li key={a.kind} className="flex items-start gap-2">
                  <BellIcon className="mt-0.5 shrink-0 text-accent" />
                  <span className="[overflow-wrap:anywhere]">
                    {t(ALERT_LABEL[a.kind as keyof typeof ALERT_LABEL], { date: f.date(a.at), time: f.time(a.at) })}
                  </span>
                </li>
              ))}
            </ul>
            {window.altOpensOn && <p className="mt-2 text-sm text-muted">{t('reminder.basedOnEarlier', { date: f.date(window.opensOn) })}</p>}
          </div>
        ) : (
          <Notice>{t('reminder.nothingLeft')}</Notice>
        )}

        {saveState === 'saved' && (
          <p role="status" className="flex items-center gap-2 font-semibold text-ok">
            <CheckIcon className="shrink-0" />
            {t('reminder.saved')}
          </p>
        )}
        {saveState === 'saved' && notificationState() !== 'granted' && <Notice>{t('reminder.alertsOff')}</Notice>}
        {saveState === 'error' && (
          <Notice tone="danger">
            <span role="alert">{t('reminder.storageError')}</span>
          </Notice>
        )}

        {hasAlerts && (
          <div className="grid gap-2">
            <Button size="lg" onClick={() => void save()} disabled={saveState === 'saved'}>
              {t('reminder.save')}
            </Button>
            <Button size="lg" variant="secondary" onClick={addToCalendar}>
              {t('reminder.addToCalendar')}
            </Button>
            <p className="text-sm text-muted">{t('reminder.calendarHint')}</p>
          </div>
        )}
        <Button variant="ghost" onClick={onClose}>
          {t('reminder.cancel')}
        </Button>
      </div>
    </Dialog>
  );
}
