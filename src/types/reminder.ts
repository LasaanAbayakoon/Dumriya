import type { IsoDate, IsoDateTime, LocalizedName } from './common';

export type ReminderKind = 'booking-opens' | 'warrant-expiry' | 'refund-deadline';

/** What a single alert says. `heads-up`/`midnight`/`opening` are for booking-opens reminders. */
export type AlertKind = 'heads-up' | 'midnight' | 'opening' | 'deadline';

export interface ReminderAlert {
  kind: AlertKind;
  at: IsoDateTime;
  firedAt?: IsoDateTime;
}

/**
 * Reminders store data, not display text, so they render in whatever language
 * the user picks later.
 */
export interface Reminder {
  id: string;
  kind: ReminderKind;
  /** One or more alerts (e.g. evening heads-up + optional midnight alert). */
  alerts: ReminderAlert[];
  /** The deadline or opening the reminder is about. */
  eventAt: IsoDateTime;
  /** True if `eventAt` is only a date (e.g. booking opening time not confirmed). */
  dateOnly?: boolean;
  /** Second possible opening date, when boarding a night train after midnight. */
  altEventDate?: IsoDate;
  createdAt: IsoDateTime;
  trainId?: string;
  ticketId?: string;
  params: {
    trainNumber?: string;
    trainName?: LocalizedName;
    fromStationId?: string;
    toStationId?: string;
    travelDate?: IsoDate;
    refundPercent?: number;
  };
}
