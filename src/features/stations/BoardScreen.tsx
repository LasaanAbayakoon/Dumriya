import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { getStation, getStationBoard } from '@/api';
import { Loading } from '@/components/Loading';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { useAsync } from '@/hooks/useAsync';
import { useFormat } from '@/hooks/useFormat';
import { useNow } from '@/hooks/useNow';
import { useStations } from '@/hooks/useStations';
import { colomboDateOf } from '@/lib/time';
import { trainUrl } from '@/lib/urls';

/** Station board (Preview): next departures, scheduled vs predicted (simulated), platform if known. */
export default function BoardScreen() {
  const { t } = useTranslation();
  const f = useFormat();
  const { stationId = '' } = useParams();
  const stations = useStations();
  const now = useNow(60_000);
  const station = useAsync(() => getStation(stationId), [stationId]);
  const board = useAsync(() => getStationBoard(stationId, now, 10), [stationId, now.getTime()]);
  const rows = board.status === 'ready' ? board.data : board.status === 'loading' ? board.stale : undefined;
  const name = station.status === 'ready' && station.data ? f.station(station.data) : t('screens.board');

  return (
    <>
      <PageHeader title={t('board.title', { station: name })} back={`/stations/${encodeURIComponent(stationId)}`} preview sampleData />
      <div className="mx-auto grid max-w-2xl gap-3 p-4">
        {station.status === 'ready' && !station.data && <Notice tone="warn">{t('stations.notFound')}</Notice>}
        <p className="text-sm text-muted" aria-live="polite">
          {t('board.updated', { time: f.time(now) })}
        </p>
        {!rows && <Loading />}
        {rows && rows.length === 0 && <Notice>{t('board.none')}</Notice>}
        {rows && rows.length > 0 && (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {rows.map((d) => {
              const late = d.predicted && d.predicted !== d.scheduled;
              return (
                <li key={`${d.trainId}-${d.scheduled}`}>
                  <Link
                    to={trainUrl(d.trainId, { date: colomboDateOf(new Date(d.scheduled)), from: stationId, to: d.destinationStationId })}
                    className="tap grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1 px-4 py-3 hover:bg-surface-2"
                  >
                    <span className="row-span-2 text-xl font-bold tabular">{f.time(d.scheduled)}</span>
                    <span className="min-w-0 font-semibold [overflow-wrap:anywhere]">
                      {f.train({ number: d.trainNumber, name: d.trainName })}{' '}
                      <span className="font-normal text-muted">{t('board.to', { station: f.station(stations?.get(d.destinationStationId)) })}</span>
                    </span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <StatusBadge status={d.status} delayMin={d.delayMin} />
                      {late && d.status !== 'cancelled' && <span className="font-semibold text-warn">{t('board.expected', { time: f.time(d.predicted!) })}</span>}
                      <span>{d.platform ? t('train.platform', { platform: d.platform }) : t('board.platformUnknown')}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
