/** Builds Reminder records and their calendar (.ics) events. Display text is supplied by the caller (i18n). */
import { REFUND_ALERT_HOURS_BEFORE, WARRANT_ALERT_HOURS_BEFORE } from '@/config/app';
import type { FollowEvent, FollowOptions, IsoDate, IsoDateTime, Reminder, ReminderAlert, SavedTicket, Trip } from '@/types';
import { bookingOpenAlerts, type BookingWindow } from './bookingWindow';
import type { IcsEvent } from './ics';
import { newId } from './id';
import { refundQuote } from './refund';
import { colomboDateTime, HOUR, toColomboIso } from './time';
import { warrantExpiry } from './warrant';

/** Kept as a named export for reminder callers. */
export const newReminderId = newId;

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
  return reminder.alerts.map((alert, i) => ({
    // Position included: a reminder can have several alerts of the same kind.
    uid: `${reminder.id}-${i}-${alert.kind}@dumriya.invalid`,
    start: new Date(alert.at),
    durationMin: 15,
    ...text(reminder, alert),
    ...(url ? { url } : {}),
  }));
}

// ── Warrant expiry ──────────────────────────────────────────────────────────

export interface WarrantInput {
  bookedAt: Date;
  /** Train's departure; the earlier (origin) time is safer if the user knows it. */
  journeyDeparture: Date;
  trainNumber?: string;
  travelDate?: IsoDate;
  now?: Date;
  id?: string;
}

/**
 * Temporary warrant reservation reminder: alerts WARRANT_ALERT_HOURS_BEFORE the expiry
 * (earlier of booking + 7 days and journey - 48 h). Alerts already past are dropped; if
 * all are past but the expiry is not, a single alert fires now-ish at the expiry itself.
 * Returns null when the warrant had already expired at booking time.
 */
export function warrantReminder({ bookedAt, journeyDeparture, trainNumber, travelDate, now = new Date(), id = newId() }: WarrantInput): Reminder | null {
  const w = warrantExpiry(bookedAt, journeyDeparture);
  if (w.expiredAtBooking) return null;
  const expires = w.expiresAt.getTime();
  let alerts: ReminderAlert[] = WARRANT_ALERT_HOURS_BEFORE.map((h) => expires - h * HOUR)
    .filter((t) => t > now.getTime())
    .map((t) => ({ kind: 'deadline' as const, at: toColomboIso(new Date(t)), deadline: toColomboIso(w.expiresAt) }));
  if (alerts.length === 0 && expires > now.getTime()) {
    alerts = [{ kind: 'deadline', at: toColomboIso(w.expiresAt), deadline: toColomboIso(w.expiresAt) }];
  }
  return {
    id,
    kind: 'warrant-expiry',
    alerts,
    eventAt: toColomboIso(w.expiresAt),
    createdAt: toColomboIso(now),
    params: {
      ...(trainNumber?.trim() ? { trainNumber: trainNumber.trim() } : {}),
      ...(travelDate ? { travelDate } : {}),
      warrantReason: w.reason,
    },
  };
}

// ── Refund drops for a saved ticket ─────────────────────────────────────────

/**
 * Alerts REFUND_ALERT_HOURS_BEFORE each future drop to a lower refund tier, using the
 * ticket's refundDeparture and the tested refundQuote(). Null when no drop is ahead.
 */
export function refundReminder(ticket: SavedTicket, { now = new Date(), id = newId() }: { now?: Date; id?: string } = {}): Reminder | null {
  const q = refundQuote({ departure: new Date(ticket.refundDeparture), fareLkr: ticket.fareLkr, serviceChargeLkr: ticket.serviceChargeLkr }, now);
  const drops = q.tiers
    .map((tier, i) => ({ at: tier.from, from: q.tiers[i - 1]?.percent, to: tier.percent }))
    .filter((d): d is { at: Date; from: number; to: number } => d.at !== null && d.from !== undefined && d.at.getTime() > now.getTime());
  if (drops.length === 0) return null;
  const alerts: ReminderAlert[] = drops.map((d) => {
    const at = Math.max(d.at.getTime() - REFUND_ALERT_HOURS_BEFORE * HOUR, now.getTime() + 60_000);
    return { kind: 'deadline', at: toColomboIso(new Date(at)), deadline: toColomboIso(d.at), dropsFrom: d.from, dropsTo: d.to };
  });
  return {
    id,
    kind: 'refund-deadline',
    alerts,
    eventAt: alerts[alerts.length - 1]!.deadline!,
    createdAt: toColomboIso(now),
    ...(ticket.trainId ? { trainId: ticket.trainId } : {}),
    ticketId: ticket.id,
    params: {
      trainNumber: ticket.trainNumber,
      fromStationId: ticket.fromStationId,
      toStationId: ticket.toStationId,
      travelDate: ticket.travelDate,
      refundPercent: q.percent,
    },
  };
}

// ── Scheduling ──────────────────────────────────────────────────────────────

export interface DueAlert {
  reminder: Reminder;
  index: number;
  alert: ReminderAlert;
}

/** Alerts whose time has come and that have not been shown yet, oldest first. */
export function dueAlerts(list: Reminder[], now: Date): DueAlert[] {
  return list
    .flatMap((reminder) => reminder.alerts.map((alert, index) => ({ reminder, index, alert })))
    .filter((d) => !d.alert.firedAt && Date.parse(d.alert.at) <= now.getTime())
    .sort((a, b) => Date.parse(a.alert.at) - Date.parse(b.alert.at));
}

/** The next alert that has not been shown yet (may already be due), or null. */
export function nextAlert(reminder: Reminder): ReminderAlert | null {
  return [...reminder.alerts].filter((a) => !a.firedAt).sort((a, b) => Date.parse(a.at) - Date.parse(b.at))[0] ?? null;
}

/** Copy of the reminder with one alert marked as shown. */
export function markFired(reminder: Reminder, index: number, at: Date): Reminder {
  return { ...reminder, alerts: reminder.alerts.map((a, i) => (i === index ? { ...a, firedAt: toColomboIso(at) } : a)) };
}

/** Upcoming reminders (with an alert still to come) first, by next alert; then finished ones, newest first. */
export function sortReminders(list: Reminder[]): { upcoming: Reminder[]; done: Reminder[] } {
  const upcoming = list.filter((r) => nextAlert(r)).sort((a, b) => Date.parse(nextAlert(a)!.at) - Date.parse(nextAlert(b)!.at));
  const done = list.filter((r) => !nextAlert(r)).sort((a, b) => Date.parse(b.eventAt) - Date.parse(a.eventAt));
  return { upcoming, done };
}

// ── Following a train (preview: events are simulated) ───────────────────────

/** Stable id, so following the same service again replaces the old settings. */
export const followReminderId = (trainId: string, serviceDate: IsoDate) => `follow-${trainId}-${serviceDate}`;

export function followReminder(
  train: Pick<Trip['train'], 'id' | 'number' | 'name'>,
  serviceDate: IsoDate,
  originDeparture: Date,
  options: FollowOptions,
  events: FollowEvent[],
  now: Date = new Date(),
): Reminder {
  return {
    id: followReminderId(train.id, serviceDate),
    kind: 'train-follow',
    alerts: events.map((e) =>
      e.kind === 'delay'
        ? { kind: 'delay', at: e.at, delayMin: e.delayMin, stationId: e.stationId }
        : { kind: 'cancelled', at: e.at },
    ),
    eventAt: toColomboIso(originDeparture),
    createdAt: toColomboIso(now),
    trainId: train.id,
    params: {
      trainNumber: train.number,
      ...(train.name ? { trainName: train.name } : {}),
      travelDate: serviceDate,
      followDelayOverMin: options.delayOverMin,
      followCancellation: options.cancellation,
    },
  };
}
