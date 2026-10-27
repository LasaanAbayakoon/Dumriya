import { useTranslation } from 'react-i18next';
import { useFormat } from '@/hooks/useFormat';
import { refundQuote } from '@/lib/refund';
import type { SavedTicket } from '@/types';

/** Live refund status for a saved ticket, from the tested refundQuote(). */
export function TicketRefundLine({ ticket, now, detailed = false }: { ticket: SavedTicket; now: Date; detailed?: boolean }) {
  const { t } = useTranslation();
  const f = useFormat();
  const q = refundQuote(
    { departure: new Date(ticket.refundDeparture), fareLkr: ticket.fareLkr, serviceChargeLkr: ticket.serviceChargeLkr },
    now,
  );
  if (q.departed || q.percent === 0) return <p className="text-sm text-muted">{t('tickets.refundNone')}</p>;
  const nextPercent = q.tiers.find((x) => x.from && q.nextDropAt && x.from.getTime() === q.nextDropAt.getTime())?.percent;

  return (
    <div className={detailed ? 'grid gap-1' : ''}>
      <p className={detailed ? 'text-lg font-bold' : 'text-sm font-semibold'}>
        {t('tickets.refundNow', { percent: q.percent, amount: f.lkr(q.refundLkr) })}
      </p>
      {q.nextDropAt && nextPercent !== undefined && (
        <p className="text-sm" data-testid="ticket-countdown">
          {t('refund.nextDrop', { percent: nextPercent, time: f.countdown(q.nextDropAt.getTime() - now.getTime()) })}
          {detailed && <> {t('refund.nextDropAt', { when: f.dateTime(q.nextDropAt) })}</>}
        </p>
      )}
    </div>
  );
}
