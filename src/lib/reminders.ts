/** Builds Reminder records and their calendar (.ics) events. Display text is supplied by the caller (i18n). */
import type { IsoDateTime, Reminder, ReminderAlert, Trip } from '@/types';
import { bookingOpenAlerts, type BookingWindow } from './bookingWindow';
import type { IcsEvent } from './ics';
import { colomboDateTime, toColomboIso } from './time';

export const newReminderId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `r-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function bookingOpensReminder(
  trip: Trip,
  window: BookingWindow,
  { midnight, now = new Date(), id = newReminderId() }: { midnight?: boolean; now?: Date; id?: string } = {},
): Reminder {
  const alerts: ReminderAlert[] = bookingOpenAlerts(window, { midnight, now }).map((a) => ({
    kind: a.kind,
    at: toColomboIso(a.at),
  }));
  const eventAt: IsoDateTime = toColomboIso(window.opensAt ?? colomboDateTime(window.opensOn, '00:00'));
  return {
    id,
    kind: 'booking-opens',
    alerts,
    eventAt,
    dateOnly: !window.timeConfirmed,
    ...(window.altOpensOn ? { altEventDate: window.altOpensOn } : {}),
    createdAt: toColomboIso(now),
    trainId: trip.train.id,
    params: {
      trainNumber: trip.train.number,
      ...(trip.train.name ? { trainName: trip.train.name } : {}),
      fromStationId: trip.from.stationId,
      toStationId: trip.to.stationId,
      travelDate: trip.date,
    },
  };
}

export type AlertText = (reminder: Reminder, alert: ReminderAlert) => { title: string; description?: string };

/** One calendar event per alert, starting exactly at the alert time, so the calendar matches the in-app alerts. */
export function reminderIcsEvents(reminder: Reminder, text: AlertText, url?: string): IcsEvent[] {
  return reminder.alerts.map((alert) => ({
    uid: `${reminder.id}-${alert.kind}@dumriya.invalid`,
    start: new Date(alert.at),
    durationMin: 15,
    ...text(reminder, alert),
    ...(url ? { url } : {}),
  }));
}
