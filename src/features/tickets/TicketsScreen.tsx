import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ButtonLink } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { PlusIcon, ShieldIcon } from '@/components/icons';
import { useFormat } from '@/hooks/useFormat';
import { useNow } from '@/hooks/useNow';
import { useStations } from '@/hooks/useStations';
import { formatBytes, sortTickets, ticketsSize } from '@/lib/tickets';
import type { SavedTicket, Station } from '@/types';
import { seatText } from './seatText';
import { TicketRefundLine } from './TicketRefundLine';
import { useTicketList } from './useTickets';

export default function TicketsScreen() {
  const { t } = useTranslation();
  const data = useTicketList();
  const now = useNow(1000);
  const stations = useStations();

  return (
    <>
      <PageHeader title={t('screens.tickets')} />
      <div className="mx-auto grid max-w-2xl gap-4 p-4">
        <p>{t('tickets.intro')}</p>
        <p className="flex items-start gap-2 text-sm font-semibold">
          <ShieldIcon className="mt-0.5 shrink-0 text-accent" />
          <span>{t('tickets.offlineNote')}</span>
        </p>
        <ButtonLink to="/tickets/new" size="lg" icon={<PlusIcon />}>
          {t('tickets.add')}
        </ButtonLink>

        {data.status === 'loading' && <Loading />}
        {data.status === 'error' && <Notice tone="danger">{t('tickets.listError')}</Notice>}
        {data.status === 'ready' && (
          <>
            {data.data.list.length === 0 ? (
              <Notice>{t('tickets.empty')}</Notice>
            ) : (
              <TicketGroups list={data.data.list} now={now} stations={stations} />
            )}
            <section className="grid gap-1 text-sm text-muted" aria-label={t('settings.dataTitle')}>
              <p data-testid="tickets-usage">{t('tickets.usage', { size: formatBytes(ticketsSize(data.data.list)) })}</p>
              {data.data.estimate && (
                <p>{t('tickets.quota', { used: formatBytes(data.data.estimate.usage), quota: formatBytes(data.data.estimate.quota) })}</p>
              )}
              {data.data.list.length > 0 && data.data.persisted !== null && (
                <p>{data.data.persisted ? t('tickets.persisted') : t('tickets.notPersisted')}</p>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}

function TicketGroups({ list, now, stations }: { list: SavedTicket[]; now: Date; stations: Map<string, Station> | null }) {
  const { t } = useTranslation();
  const { upcoming, past } = sortTickets(list, now);
  return (
    <>
      {[
        { key: 'up', title: t('tickets.upcoming'), items: upcoming },
        { key: 'past', title: t('tickets.past'), items: past },
      ]
        .filter((g) => g.items.length > 0)
        .map((g) => (
          <section key={g.key} aria-labelledby={`tickets-${g.key}`}>
            <h2 id={`tickets-${g.key}`} className="mb-2 text-lg font-bold">
              {g.title}
            </h2>
            <ul className="grid gap-3">
              {g.items.map((ticket) => (
                <li key={ticket.id}>
                  <TicketCard ticket={ticket} now={now} stations={stations} />
                </li>
              ))}
            </ul>
          </section>
        ))}
    </>
  );
}

function TicketCard({ ticket, now, stations }: { ticket: SavedTicket; now: Date; stations: Map<string, Station> | null }) {
  const { t } = useTranslation();
  const f = useFormat();
  const seat = seatText(t, ticket);
  return (
    <Link to={`/tickets/${encodeURIComponent(ticket.id)}`} className="block rounded-2xl border border-border bg-surface p-4 hover:border-accent">
      <h3 className="font-bold [overflow-wrap:anywhere]">{t('train.number', { number: ticket.trainNumber })}</h3>
      <p className="[overflow-wrap:anywhere]">
        {t('results.route', { from: f.station(stations?.get(ticket.fromStationId)), to: f.station(stations?.get(ticket.toStationId)) })}
      </p>
      <p className="font-semibold">{t('format.chosenDateTime', { date: f.date(ticket.travelDate), time: f.time(ticket.departure) })}</p>
      {seat && <p className="text-sm">{seat}</p>}
      <div className="mt-2 border-t border-border pt-2">
        <TicketRefundLine ticket={ticket} now={now} />
      </div>
    </Link>
  );
}
