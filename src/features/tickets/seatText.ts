import type { TFunction } from 'i18next';
import type { SavedTicket } from '@/types';

export function seatText(t: TFunction, ticket: Pick<SavedTicket, 'coach' | 'seat'>): string | null {
  if (ticket.coach && ticket.seat) return t('tickets.coachSeat', { coach: ticket.coach, seat: ticket.seat });
  if (ticket.coach) return t('tickets.coachOnly', { coach: ticket.coach });
  if (ticket.seat) return t('tickets.seatOnly', { seat: ticket.seat });
  return null;
}
