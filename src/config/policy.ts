/**
 * Every Sri Lanka Railways policy rule the app relies on lives in this file.
 *
 * ⚠️ These are hard-coded from public SLR / seat-reservation FAQ information and
 * MUST be re-checked against the official FAQ before each release. The README
 * lists every rule here; keep the two in sync.
 *
 * All times are interpreted in POLICY_TIMEZONE, regardless of the phone's time zone.
 */

/** Sri Lanka uses a fixed UTC+05:30 offset with no daylight saving. */
export const POLICY_TIMEZONE = 'Asia/Colombo';
export const POLICY_UTC_OFFSET = '+05:30';

// ── Reserved-seat booking window ────────────────────────────────────────────

/**
 * Reservations open this many calendar days before the date of travel (counted by date in Asia/Colombo).
 *
 * ASSUMED, CONSERVATIVE – verify with SLR: "date of travel" is taken as the date the train
 * leaves its ORIGIN. When a passenger boards on a later calendar date (night trains after
 * midnight), the UI shows both possible opening dates and reminders use the earlier one.
 */
export const BOOKING_WINDOW_DAYS = 30;

/**
 * Clock time (`HH:mm`, Asia/Colombo) at which booking opens on the opening date.
 * The official FAQ only says "30 days prior to the date of travel" with no time,
 * so this is null: the UI shows the opening date only, with a "time not confirmed"
 * note, and no countdown. Set it once confirmed to enable an exact time and countdown.
 */
export const BOOKING_OPEN_TIME: string | null = null;

/** Online booking closes this many hours before the train's scheduled departure. */
export const BOOKING_CLOSE_HOURS_BEFORE = 2;

/**
 * ASSUMED, CONSERVATIVE – verify with SLR: the close time is measured from the departure at
 * the train's ORIGIN station (the earliest possible close). Set to true to measure from the
 * passenger's boarding station instead.
 */
export const BOOKING_CLOSE_USE_BOARDING_STATION = false;

/** Maximum seats in a single online booking. */
export const MAX_SEATS_PER_BOOKING = 5;

/** Online convenience fee, added on top of the ticket fare. */
export const CONVENIENCE_FEE_RATE = 0.05;

/** Accepted online payment methods. */
export const PAYMENT_METHODS = ['card', 'lankaqr'] as const;

/** A valid email address is required; the e-ticket is only sent by email. */
export const EMAIL_REQUIRED_FOR_ETICKET = true;

// ── Passengers and ID ───────────────────────────────────────────────────────

/** Each passenger's NIC or passport number must be entered when booking. */
export const ID_REQUIRED_PER_PASSENGER = true;
/** Reserved tickets are non-transferable; ID is checked at the gate. */
export const TICKETS_TRANSFERABLE = false;
/** Penalty when the passenger's ID doesn't match the ticket. */
export const ID_MISMATCH_PENALTY_FARE_MULTIPLIER = 2;

// ── Refunds ─────────────────────────────────────────────────────────────────

/**
 * Refund tiers by time remaining before scheduled departure, checked in order.
 * A tier applies only when the time left is STRICTLY MORE than `moreThanHours`;
 * on an exact boundary the lower refund applies:
 *   > 168 h → 75 %   ·   ≤ 168 h and > 48 h → 50 %   ·   ≤ 48 h → 0 %
 */
export const REFUND_TIERS: readonly { moreThanHours: number; percent: number }[] = [
  { moreThanHours: 168, percent: 75 },
  { moreThanHours: 48, percent: 50 },
];
/**
 * ASSUMED, CONSERVATIVE – verify with SLR: refund deadlines are counted from the
 * train's departure at its ORIGIN station (the earliest possible reading). Set to true
 * to count from the passenger's boarding station instead.
 */
export const REFUND_COUNT_FROM_BOARDING_STATION = false;
/** Refund when no tier applies. */
export const REFUND_FALLBACK_PERCENT = 0;
/** The service charge / convenience fee is never refunded. */
export const SERVICE_CHARGE_REFUNDABLE = false;
/** Refunds are only processed in person at a station counter. */
export const REFUND_IN_PERSON_ONLY = true;
/** Documents to bring to the counter for a refund. */
export const REFUND_DOCUMENTS = ['nicOrPassportCopy'] as const;

// ── Warrants ────────────────────────────────────────────────────────────────

/** A temporary warrant reservation expires this many days after it was made… */
export const WARRANT_EXPIRES_DAYS_AFTER_BOOKING = 7;
/** …or this many hours before the journey, whichever comes first. It must be confirmed at a station. */
export const WARRANT_EXPIRES_HOURS_BEFORE_JOURNEY = 48;

// ── Commuter (unreserved) tickets ───────────────────────────────────────────

/** Pravesha commuter tickets can be bought up to this many days in advance. */
export const PRAVESHA_ADVANCE_DAYS = 7;

/**
 * ASSUMED – verify with SLR (source: Sunday Observer, Sep 2024): at most this many
 * Pravesha tickets in one order, return tickets included. The UI says it is not confirmed.
 */
export const PRAVESHA_MAX_TICKETS_PER_ORDER = 5;

// ── Payment disputes ────────────────────────────────────────────────────────

/** Dispute type to choose on the official site's Contact Us form. */
export const DISPUTE_TYPE_LABEL = 'Payment issue';
