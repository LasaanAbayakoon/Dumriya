import type { IsoDate, IsoDateTime, LocalizedName } from './common';

export type ReminderKind = 'booking-opens' | 'warrant-expiry' | 'refund-deadline' | 'train-follow';

/** What a single alert says. `heads-up`/`midnight`/`opening` are for booking-opens reminders. */
export type AlertKind = 'heads-up' | 'midnight' | 'opening' | 'deadline' | 'delay' | 'cancelled';

export interface ReminderAlert {
  kind: AlertKind;
  at: IsoDateTime;
  firedAt?: IsoDateTime;
  /** For deadline alerts: the deadline this alert warns about. */
  deadline?: IsoDateTime;
  /** For refund alerts: the refund % before and after the drop. */
  dropsFrom?: number;
  dropsTo?: number;
  /** For follow alerts (simulated in the preview): delay and where. */
  delayMin?: number;
  stationId?: string;
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
    /** Warrant: which limit applied (7 days after booking, or 48 h before the journey). */
    warrantReason?: 'days-after-booking' | 'hours-before-journey';
    /** Follow settings (to restore the toggles). */
    followDelayOverMin?: number | null;
    followCancellation?: boolean;
  };
}
