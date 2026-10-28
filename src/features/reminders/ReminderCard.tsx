import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Dialog } from '@/components/Dialog';
import { BellIcon, CalendarIcon, CheckIcon, TrashIcon } from '@/components/icons';
import { useFormat } from '@/hooks/useFormat';
import { useStations } from '@/hooks/useStations';
import { buildIcs, downloadIcs } from '@/lib/ics';
import { nextAlert, reminderIcsEvents } from '@/lib/reminders';
import type { Reminder } from '@/types';
import { useAlertText } from './useAlertText';

const KIND_LABEL = {
  'booking-opens': 'reminders.kindBooking',
  'warrant-expiry': 'reminders.kindWarrant',
  'refund-deadline': 'reminders.kindRefund',
} as const;

export function ReminderCard({ reminder, onDelete }: { reminder: Reminder; onDelete: (id: string) => Promise<void> }) {
  const { t } = useTranslation();
  const f = useFormat();
  const stations = useStations();
  const alertText = useAlertText();
  const [confirming, setConfirming] = useState(false);
  const p = reminder.params;
  const next = nextAlert(reminder);

  const train = p.trainNumber ? f.train({ number: p.trainNumber, name: p.trainName ?? null }) : null;
  const route =
    p.fromStationId && p.toStationId
      ? t('results.route', { from: f.station(stations?.get(p.fromStationId)), to: f.station(stations?.get(p.toStationId)) })
      : null;

  // What the reminder is about, in plain words (uncertainty included).
  const about =
    reminder.kind === 'booking-opens'
      ? reminder.dateOnly
        ? reminder.altEventDate
          ? t('reminders.bookingOnTwo', { early: f.date(reminder.eventAt), late: f.date(reminder.altEventDate) })
          : t('reminders.bookingOn', { date: f.date(reminder.eventAt) })
        : t('reminders.bookingAt', { when: f.dateTime(reminder.eventAt) })
      : reminder.kind === 'warrant-expiry'
        ? t('reminders.warrantExpires', { when: f.dateTime(reminder.eventAt) })
        : null;

  return (
    <Card>
      <article aria-labelledby={`rem-${reminder.id}`} className="grid gap-2">
        <p className="text-sm font-semibold text-accent">{t(KIND_LABEL[reminder.kind])}</p>
        <h3 id={`rem-${reminder.id}`} className="font-bold [overflow-wrap:anywhere]">
          {[train, p.travelDate ? f.date(p.travelDate) : null].filter(Boolean).join(' · ') || t(KIND_LABEL[reminder.kind])}
        </h3>
        {route && <p className="text-sm [overflow-wrap:anywhere]">{route}</p>}
        {about && <p>{about}</p>}
        {reminder.kind === 'refund-deadline' &&
          reminder.alerts.map((a) => (
            <p key={a.at}>{t('reminders.refundDrops', { from: a.dropsFrom, to: a.dropsTo, when: f.dateTime(a.deadline ?? a.at) })}</p>
          ))}

        <div>
          <p className="text-sm font-semibold text-muted">{t('reminders.alertsTitle')}</p>
          <ul className="grid gap-0.5">
            {reminder.alerts.map((a, i) => (
              <li key={`${a.at}-${i}`} className={`flex items-center gap-2 text-sm ${a.firedAt ? 'text-muted' : ''}`}>
                {a.firedAt ? <CheckIcon className="shrink-0" /> : <BellIcon className="shrink-0 text-accent" />}
                <span>{a.firedAt ? t('reminders.alertShown', { when: f.dateTime(a.at) }) : t('reminders.alertPending', { when: f.dateTime(a.at) })}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-sm font-semibold">{next ? t('reminders.nextAlert', { when: f.dateTime(next.at) }) : t('reminders.allDone')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {next && (
            <Button
              variant="secondary"
              icon={<CalendarIcon />}
              onClick={() => downloadIcs(`dumriya-reminder-${reminder.id}.ics`, buildIcs(reminderIcsEvents(reminder, alertText)))}
            >
              {t('reminder.addToCalendar')}
            </Button>
          )}
          <Button variant="danger" icon={<TrashIcon />} onClick={() => setConfirming(true)}>
            {t('reminders.delete')}
          </Button>
        </div>
      </article>

      {confirming && (
        <Dialog title={t('reminders.deleteTitle')} onClose={() => setConfirming(false)}>
          <div className="grid gap-3 p-4">
            <p>{t('reminders.deleteBody')}</p>
            <Button
              variant="danger"
              size="lg"
              onClick={() => {
                setConfirming(false);
                void onDelete(reminder.id);
              }}
            >
              {t('reminders.deleteConfirm')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {t('reminders.cancel')}
            </Button>
          </div>
        </Dialog>
      )}
    </Card>
  );
}
