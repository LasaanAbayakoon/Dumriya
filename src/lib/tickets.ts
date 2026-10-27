/**
 * Ticket wallet logic. The ticket file is never opened, read or parsed: the user
 * types or confirms every detail.
 */
import { MAX_TICKET_FILE_BYTES } from '@/config/app';
import type { IsoDate, SavedTicket, TravelClass, Trip } from '@/types';
import { refundDepartureForTrip } from './refund';
import { colomboDateTime, toColomboIso } from './time';

export const TICKET_FILE_ACCEPT = 'application/pdf,image/*';

export type TicketFileError = 'type' | 'size';

export function checkTicketFile(file: { type: string; size: number; name: string }): TicketFileError | null {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  const isImage = file.type.startsWith('image/');
  if (!isPdf && !isImage) return 'type';
  if (file.size > MAX_TICKET_FILE_BYTES) return 'size';
  return null;
}

export const isPdfTicket = (t: Pick<SavedTicket, 'file'>) => t.file.type === 'application/pdf' || /\.pdf$/i.test(t.file.name);

export interface TicketInput {
  id: string;
  now: Date;
  file: { name: string; type: string; size: number; data: ArrayBuffer };
  trainNumber: string;
  fromStationId: string;
  toStationId: string;
  travelDate: IsoDate;
  departureTime: string;
  coach?: string;
  seat?: string;
  reference?: string;
  travelClass?: TravelClass;
  fareLkr: number;
  serviceChargeLkr: number;
  /** The matching timetable trip, if the train is known. */
  trip?: Trip | null;
}

/**
 * Build the stored ticket. Refund deadlines count from the EARLIER of the entered
 * departure and the train's origin departure (assumed, conservative), worked out now
 * so the wallet's countdowns need no network later.
 */
export function buildTicket(input: TicketInput): SavedTicket {
  const entered = colomboDateTime(input.travelDate, input.departureTime);
  const origin = input.trip ? refundDepartureForTrip(input.trip) : null;
  const useOrigin = origin !== null && origin.getTime() < entered.getTime();
  const opt = (s?: string) => (s && s.trim() ? s.trim() : undefined);
  return {
    id: input.id,
    createdAt: toColomboIso(input.now),
    file: input.file,
    trainNumber: input.trainNumber.trim(),
    ...(input.trip ? { trainId: input.trip.train.id } : {}),
    fromStationId: input.fromStationId,
    toStationId: input.toStationId,
    travelDate: input.travelDate,
    departure: toColomboIso(entered),
    refundDeparture: toColomboIso(useOrigin ? origin : entered),
    refundBasis: useOrigin ? 'origin' : 'entered',
    ...(useOrigin ? { originStationId: input.trip!.train.stops[0]!.stationId } : {}),
    ...(input.travelClass ? { travelClass: input.travelClass } : {}),
    ...(opt(input.coach) ? { coach: opt(input.coach) } : {}),
    ...(opt(input.seat) ? { seat: opt(input.seat) } : {}),
    ...(opt(input.reference) ? { reference: opt(input.reference) } : {}),
    fareLkr: input.fareLkr,
    serviceChargeLkr: input.serviceChargeLkr,
  };
}

/** Upcoming first (soonest first), then past trips (most recent first). */
export function sortTickets(list: SavedTicket[], now: Date): { upcoming: SavedTicket[]; past: SavedTicket[] } {
  const t = now.getTime();
  const by = (a: SavedTicket, b: SavedTicket) => Date.parse(a.departure) - Date.parse(b.departure);
  return {
    upcoming: list.filter((x) => Date.parse(x.departure) >= t).sort(by),
    past: list.filter((x) => Date.parse(x.departure) < t).sort((a, b) => by(b, a)),
  };
}

export const ticketsSize = (list: SavedTicket[]) => list.reduce((sum, x) => sum + x.file.size, 0);

/** "1.2 MB", "340 KB" (units are the same in all three languages). */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(1)} GB`;
}
