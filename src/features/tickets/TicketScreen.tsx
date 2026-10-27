import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { buttonClass } from '@/components/buttonClass';
import { Card } from '@/components/Card';
import { Dialog } from '@/components/Dialog';
import { ExternalLink } from '@/components/ExternalLink';
import { Loading } from '@/components/Loading';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { ChevronRightIcon, ExternalIcon, TrashIcon } from '@/components/icons';
import { useFormat } from '@/hooks/useFormat';
import { useNow } from '@/hooks/useNow';
import { useStations } from '@/hooks/useStations';
import { tickets } from '@/lib/storage';
import { isPdfTicket } from '@/lib/tickets';
import { refundUrl } from '@/lib/urls';
import type { SavedTicket } from '@/types';
import { seatText } from './seatText';
import { TicketRefundLine } from './TicketRefundLine';
import { useTicket } from './useTickets';

/**
 * Attaches an object URL for the stored file to an <img src> or <a href> and revokes it
 * when the element goes away (React 19 ref cleanup). No state, so nothing re-renders.
 */
function useFileUrlRef<E extends HTMLImageElement | HTMLAnchorElement>(ticket: SavedTicket, attr: 'src' | 'href') {
  return useCallback(
    (el: E | null) => {
      if (!el || typeof URL.createObjectURL !== 'function') return;
      const url = URL.createObjectURL(new Blob([ticket.file.data], { type: ticket.file.type }));
      el.setAttribute(attr, url);
      return () => URL.revokeObjectURL(url);
    },
    [ticket, attr],
  );
}

export default function TicketScreen() {
  const { t } = useTranslation();
  const { ticketId = '' } = useParams();
  const data = useTicket(ticketId);

  if (data.status === 'loading') {
    return (
      <>
        <PageHeader title={t('screens.ticket')} back="/tickets" />
        <Loading />
      </>
    );
  }
  if (data.status === 'error' || !data.data) {
    return (
      <>
        <PageHeader title={t('screens.ticket')} back="/tickets" />
        <div className="mx-auto max-w-2xl p-4">
          <Notice tone={data.status === 'error' ? 'danger' : 'warn'}>
            {data.status === 'error' ? t('tickets.listError') : t('tickets.notFound')}
          </Notice>
        </div>
      </>
    );
  }
  return <TicketDetail ticket={data.data} />;
}

function TicketDetail({ ticket }: { ticket: SavedTicket }) {
  const { t } = useTranslation();
  const f = useFormat();
  const navigate = useNavigate();
  const now = useNow(1000);
  const stations = useStations();
  const imgRef = useFileUrlRef<HTMLImageElement>(ticket, 'src');
  const linkRef = useFileUrlRef<HTMLAnchorElement>(ticket, 'href');
  const [confirming, setConfirming] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  const title = t('train.number', { number: ticket.trainNumber });
  const seat = seatText(t, ticket);
  const pdf = isPdfTicket(ticket);

  const remove = async () => {
    try {
      await tickets.remove(ticket.id);
      void navigate('/tickets', { replace: true });
    } catch {
      setConfirming(false);
      setDeleteFailed(true);
    }
  };

  return (
    <>
      <PageHeader title={title} back="/tickets" />
      <div className="mx-auto grid max-w-2xl gap-4 p-4">
        <Card>
          <section aria-labelledby="ticket-details" className="grid gap-2">
            <h2 id="ticket-details" className="text-lg font-bold">
              {t('tickets.details')}
            </h2>
            <dl className="grid gap-2">
              <div>
                <dt className="text-sm text-muted">{t('tickets.route')}</dt>
                <dd className="font-semibold [overflow-wrap:anywhere]">
                  {t('results.route', {
                    from: f.station(stations?.get(ticket.fromStationId)),
                    to: f.station(stations?.get(ticket.toStationId)),
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">{t('train.departs')}</dt>
                <dd className="font-semibold">{t('format.chosenDateTime', { date: f.date(ticket.travelDate), time: f.time(ticket.departure) })}</dd>
              </div>
              {seat && (
                <div>
                  <dt className="sr-only">{t('tickets.seat')}</dt>
                  <dd className="text-lg font-bold">{seat}</dd>
                </div>
              )}
              {ticket.reference && (
                <div>
                  <dt className="text-sm text-muted">{t('tickets.reference')}</dt>
                  <dd className="font-semibold break-all">{ticket.reference}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-muted">{t('refund.fare')}</dt>
                <dd className="font-semibold">
                  {f.lkr(ticket.fareLkr)} <span className="text-sm font-normal">+ {f.lkr(ticket.serviceChargeLkr)}</span>
                </dd>
              </div>
            </dl>
          </section>
        </Card>

        <Card>
          {!pdf && <img ref={imgRef} alt={t('tickets.imageAlt')} className="w-full rounded-xl border border-border" />}
          {pdf && (
            <ExternalLink ref={linkRef} href="#" className={buttonClass('secondary', 'lg')}>
              <span className="min-w-0">{t('tickets.openFile')}</span>
              <ExternalIcon className="shrink-0" />
            </ExternalLink>
          )}
          <p className="mt-2 text-sm text-muted [overflow-wrap:anywhere]">{ticket.file.name}</p>
          <p className="text-sm font-semibold">{t('tickets.offlineNote')}</p>
        </Card>

        <Card>
          <section aria-labelledby="ticket-refund" className="grid gap-2">
            <h2 id="ticket-refund" className="text-lg font-bold">
              {t('tickets.refundTitle')}
            </h2>
            <TicketRefundLine ticket={ticket} now={now} detailed />
            {ticket.refundBasis === 'origin' && ticket.originStationId ? (
              <Notice tone="warn" title={t('common.notConfirmed')}>
                {t('refund.originNote', {
                  origin: f.station(stations?.get(ticket.originStationId)),
                  when: f.dateTime(ticket.refundDeparture),
                })}
              </Notice>
            ) : (
              <p className="text-sm text-muted">{t('tickets.basisEntered')}</p>
            )}
            <Link
              to={refundUrl({
                departure: ticket.refundDeparture,
                fare: ticket.fareLkr,
                serviceCharge: ticket.serviceChargeLkr,
                trainId: ticket.trainId,
                date: ticket.trainId ? ticket.travelDate : undefined,
                from: ticket.trainId ? ticket.fromStationId : undefined,
                to: ticket.trainId ? ticket.toStationId : undefined,
              })}
              className="tap inline-flex items-center gap-1 font-semibold text-accent underline"
            >
              {t('tickets.openRefund')}
              <ChevronRightIcon className="shrink-0" />
            </Link>
          </section>
        </Card>

        {deleteFailed && (
          <Notice tone="danger">
            <span role="alert">{t('tickets.deleteFailed')}</span>
          </Notice>
        )}
        <Button variant="danger" icon={<TrashIcon />} onClick={() => setConfirming(true)}>
          {t('tickets.delete')}
        </Button>
      </div>

      {confirming && (
        <Dialog title={t('tickets.deleteTitle')} onClose={() => setConfirming(false)}>
          <div className="grid gap-3 p-4">
            <p>{t('tickets.deleteBody')}</p>
            <Button variant="danger" size="lg" onClick={() => void remove()}>
              {t('tickets.deleteConfirm')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {t('tickets.cancel')}
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
