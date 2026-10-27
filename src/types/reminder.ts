import type { IsoDateTime } from './common';

export type ReminderKind = 'booking-opens' | 'warrant-expiry' | 'refund-deadline';

/**
 * Reminders store data, not display text, so they render in whatever language
 * the user picks later.
 */
export interface Reminder {
  id: string;
  kind: ReminderKind;
  /** When to alert. */
  fireAt: IsoDateTime;
  /** The deadline or opening the reminder is about (may equal fireAt). */
  eventAt: IsoDateTime;
  createdAt: IsoDateTime;
  firedAt?: IsoDateTime;
  /** True if `eventAt` is a date only (e.g. booking opening time not confirmed). */
  dateOnly?: boolean;
  trainId?: string;
  ticketId?: string;
  params: {
    trainNumber?: string;
    trainName?: string;
    fromLabel?: string;
    toLabel?: string;
    travelDate?: string;
    refundPercent?: number;
  };
}
