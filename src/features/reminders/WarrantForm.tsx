import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { ChosenDateTime } from '@/components/ChosenDateTime';
import { Notice } from '@/components/Notice';
import { WARRANT_EXPIRES_DAYS_AFTER_BOOKING, WARRANT_EXPIRES_HOURS_BEFORE_JOURNEY } from '@/config/policy';
import { useFormat } from '@/hooks/useFormat';
import { warrantReminder } from '@/lib/reminders';
import { colomboDateTime, isClockTime, isIsoDate } from '@/lib/time';
import { warrantExpiry } from '@/lib/warrant';
import type { Reminder } from '@/types';

/** Warrant reminder: the expiry rule lives in lib/warrant.ts; this only collects the inputs. */
export function WarrantForm({ onSave }: { onSave: (r: Reminder) => Promise<boolean> }) {
  const { t } = useTranslation();
  const f = useFormat();
  const [bookedDate, setBookedDate] = useState('');
  const [bookedTime, setBookedTime] = useState('');
  const [journeyDate, setJourneyDate] = useState('');
  const [journeyTime, setJourneyTime] = useState('');
  const [train, setTrain] = useState('');
  const [attempted, setAttempted] = useState(false);

  const booked = isIsoDate(bookedDate) && isClockTime(bookedTime) ? colomboDateTime(bookedDate, bookedTime) : null;
  const journey = isIsoDate(journeyDate) && isClockTime(journeyTime) ? colomboDateTime(journeyDate, journeyTime) : null;
  const preview = booked && journey ? warrantExpiry(booked, journey) : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (!booked || !journey || !preview || preview.expiredAtBooking) {
      const first = !isIsoDate(bookedDate) ? 'w-booked-date' : !isClockTime(bookedTime) ? 'w-booked-time' : !isIsoDate(journeyDate) ? 'w-journey-date' : 'w-journey-time';
      document.getElementById(first)?.focus();
      return;
    }
    const r = warrantReminder({ bookedAt: booked, journeyDeparture: journey, trainNumber: train, travelDate: journeyDate });
    if (r && (await onSave(r))) {
      setBookedDate('');
      setBookedTime('');
      setJourneyDate('');
      setJourneyTime('');
      setTrain('');
      setAttempted(false);
    }
  };

  const input = (bad: boolean) => `tap w-full rounded-xl border bg-surface px-3 py-2 text-lg ${bad ? 'border-danger' : 'border-border'}`;
  const label = 'mb-1 block text-sm font-semibold text-muted';
  const err = (ok: boolean) => (attempted && !ok ? <p className="mt-1 text-sm font-semibold text-danger">{t('reminders.errorRequired')}</p> : null);

  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="grid gap-3" aria-labelledby="warrant-title">
      <h2 id="warrant-title" className="text-lg font-bold">
        {t('reminders.warrantTitle')}
      </h2>
      <p>{t('reminders.warrantIntro', { days: WARRANT_EXPIRES_DAYS_AFTER_BOOKING, hours: WARRANT_EXPIRES_HOURS_BEFORE_JOURNEY })}</p>

      <div className="grid gap-3 min-[400px]:grid-cols-2">
        <div>
          <label htmlFor="w-booked-date" className={label}>{t('reminders.bookedDate')}</label>
          <input id="w-booked-date" type="date" value={bookedDate} onChange={(e) => setBookedDate(e.target.value)} aria-describedby="w-booked-chosen" className={input(attempted && !isIsoDate(bookedDate))} />
          {err(isIsoDate(bookedDate))}
        </div>
        <div>
          <label htmlFor="w-booked-time" className={label}>{t('reminders.bookedTime')}</label>
          <input id="w-booked-time" type="time" value={bookedTime} onChange={(e) => setBookedTime(e.target.value)} aria-describedby="w-booked-chosen" className={input(attempted && !isClockTime(bookedTime))} />
          {err(isClockTime(bookedTime))}
        </div>
      </div>
      <ChosenDateTime id="w-booked-chosen" date={bookedDate} time={bookedTime} />

      <div className="grid gap-3 min-[400px]:grid-cols-2">
        <div>
          <label htmlFor="w-journey-date" className={label}>{t('reminders.journeyDate')}</label>
          <input id="w-journey-date" type="date" value={journeyDate} onChange={(e) => setJourneyDate(e.target.value)} aria-describedby="w-journey-chosen" className={input(attempted && !isIsoDate(journeyDate))} />
          {err(isIsoDate(journeyDate))}
        </div>
        <div>
          <label htmlFor="w-journey-time" className={label}>{t('reminders.journeyTime')}</label>
          <input id="w-journey-time" type="time" value={journeyTime} onChange={(e) => setJourneyTime(e.target.value)} aria-describedby="w-journey-hint w-journey-chosen" className={input(attempted && !isClockTime(journeyTime))} />
          {err(isClockTime(journeyTime))}
        </div>
      </div>
      <p id="w-journey-hint" className="-mt-2 text-sm text-muted">{t('reminders.journeyHint')}</p>
      <ChosenDateTime id="w-journey-chosen" date={journeyDate} time={journeyTime} />

      <div>
        <label htmlFor="w-train" className={label}>{t('reminders.trainOptional')}</label>
        <input id="w-train" inputMode="numeric" value={train} onChange={(e) => setTrain(e.target.value)} className={input(false)} />
      </div>

      {preview && !preview.expiredAtBooking && (
        <Notice>
          <p className="font-semibold" data-testid="warrant-preview">{t('reminders.warrantPreview', { when: f.dateTime(preview.expiresAt) })}</p>
          <p>
            {preview.reason === 'days-after-booking'
              ? t('reminders.reasonDays', { days: WARRANT_EXPIRES_DAYS_AFTER_BOOKING })
              : t('reminders.reasonHours', { hours: WARRANT_EXPIRES_HOURS_BEFORE_JOURNEY })}
          </p>
        </Notice>
      )}
      {preview?.expiredAtBooking && (
        <Notice tone="warn">
          <span role="alert">{t('reminders.warrantExpired', { hours: WARRANT_EXPIRES_HOURS_BEFORE_JOURNEY })}</span>
        </Notice>
      )}
      <Button type="submit" size="lg">{t('reminders.saveWarrant')}</Button>
    </form>
  );
}
