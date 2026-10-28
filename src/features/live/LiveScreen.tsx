import { lazy, Suspense, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { getLivePosition, getTrain } from '@/api';
import { Card } from '@/components/Card';
import { Loading } from '@/components/Loading';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { LIVE_REFRESH_MS } from '@/config/app';
import { useAsync } from '@/hooks/useAsync';
import { useFormat } from '@/hooks/useFormat';
import { useNow } from '@/hooks/useNow';
import { useStations } from '@/hooks/useStations';
import { colomboDateTime, isIsoDate, todayInColombo, weekdayOf } from '@/lib/time';
import type { LivePosition, Station, Train } from '@/types';
import { FollowCard } from './FollowCard';
import { ShareDemo } from './ShareDemo';

const LiveTrainMap = lazy(() => import('./LiveTrainMap'));

export default function LiveScreen() {
  const { t } = useTranslation();
  const f = useFormat();
  const { trainId = '' } = useParams();
  const [params] = useSearchParams();
  const today = useMemo(() => todayInColombo(), []);
  const raw = params.get('date');
  const serviceDate = raw && isIsoDate(raw) ? raw : today;
  const train = useAsync(() => getTrain(trainId), [trainId]);

  const header = (title: string) => <PageHeader title={title} back preview sampleData />;
  if (train.status === 'loading') return <>{header(t('screens.live'))}<Loading /></>;
  if (train.status === 'error' || !train.data) {
    return (
      <>
        {header(t('screens.live'))}
        <div className="mx-auto max-w-2xl p-4">
          <Notice tone="warn">{train.status === 'error' ? t('common.error') : t('train.notFound')}</Notice>
        </div>
      </>
    );
  }
  if (!train.data.runningDays.includes(weekdayOf(serviceDate))) {
    return (
      <>
        {header(f.train(train.data))}
        <div className="mx-auto max-w-2xl p-4">
          <Notice tone="warn">{t('live.notRunning', { date: f.date(serviceDate) })}</Notice>
        </div>
      </>
    );
  }
  return (
    <>
      {header(f.train(train.data))}
      <LiveTrain train={train.data} serviceDate={serviceDate} />
    </>
  );
}

function LiveTrain({ train, serviceDate }: { train: Train; serviceDate: string }) {
  const f = useFormat();
  const stations = useStations();
  const now = useNow(LIVE_REFRESH_MS);
  const live = useAsync(() => getLivePosition(train.id, serviceDate, now), [train.id, serviceDate, now.getTime()]);
  const pos = live.status === 'ready' ? live.data : live.status === 'loading' ? live.stale : null;
  const originDeparture = colomboDateTime(serviceDate, train.stops[0]!.departure!, train.stops[0]!.dayOffset);
  const terminus = f.station(stations?.get(train.stops[train.stops.length - 1]!.stationId));

  return (
    <div className="mx-auto grid max-w-2xl gap-4 p-4">
      {!pos ? (
        <Loading />
      ) : (
        <>
          <StatusCard pos={pos} now={now} stations={stations} />
          <Suspense fallback={<Loading />}>
            <LiveMapFor pos={pos} stations={stations} />
          </Suspense>
          <StopsTable pos={pos} stations={stations} />
        </>
      )}
      <ShareDemo trainLabel={f.train(train)} terminus={terminus} />
      <FollowCard train={train} serviceDate={serviceDate} originDeparture={originDeparture} stations={stations} />
    </div>
  );
}

function StatusCard({ pos, now, stations }: { pos: LivePosition; now: Date; stations: Map<string, Station> | null }) {
  const { t } = useTranslation();
  const f = useFormat();
  const ago = Math.max(0, Math.floor((now.getTime() - Date.parse(pos.updatedAt)) / 60_000));
  const next = f.station(stations?.get(pos.nextStopId));
  const first = pos.stops[0]!;

  return (
    <Card>
      <section aria-labelledby="live-status" className="grid gap-2">
        <h2 id="live-status" className="sr-only">
          {t('live.colStatus')}
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge status={pos.status} delayMin={pos.delayMin} />
          <p className="text-sm text-muted" data-testid="live-updated">
            {ago === 0 ? t('live.updatedNow') : t('live.updated', { count: ago })}
          </p>
        </div>
        {pos.status === 'cancelled' && <p>{t('live.cancelledNote')}</p>}
        {pos.status === 'not-started' && (
          <p className="font-semibold">
            {t('live.notStarted', { station: f.station(stations?.get(first.stationId)), time: f.time(first.scheduledDeparture!) })}
          </p>
        )}
        {pos.status === 'arrived' && <p className="font-semibold">{t('live.arrived', { station: next })}</p>}
        {(pos.status === 'on-time' || pos.status === 'delayed') && (
          <>
            <p className="text-lg font-bold">{t('live.nextStop', { station: next })}</p>
            <p>
              {pos.nextStopScheduled && <span>{t('live.scheduled', { time: f.time(pos.nextStopScheduled) })}</span>}
              {pos.nextStopPredicted && (
                <span className={`ml-3 font-semibold ${pos.status === 'delayed' ? 'text-warn' : ''}`}>
                  {t('live.predicted', { time: f.time(pos.nextStopPredicted) })}
                </span>
              )}
            </p>
          </>
        )}
      </section>
    </Card>
  );
}

function LiveMapFor({ pos, stations }: { pos: LivePosition; stations: Map<string, Station> | null }) {
  const { t } = useTranslation();
  const f = useFormat();
  // Recompute the stop layer only when a stop is passed, not on every refresh.
  const passedKey = pos.stops.map((s) => (s.passed ? '1' : '0')).join('');
  const mapStops = useMemo(
    () =>
      stations
        ? pos.stops.map((s, i) => {
            const st = stations.get(s.stationId)!;
            return { lat: st.lat, lng: st.lng, label: f.station(st), passed: passedKey[i] === '1' };
          })
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stations, passedKey, f],
  );
  const train = useMemo(
    () => (pos.status === 'cancelled' ? null : { lat: pos.lat, lng: pos.lng, label: t('live.trainMarker') }),
    [pos.lat, pos.lng, pos.status, t],
  );
  return <LiveTrainMap stops={mapStops} train={train} ariaLabel={t('live.mapLabel')} />;
}

/** Text alternative to the map: every stop, scheduled vs predicted, passed / next. */
function StopsTable({ pos, stations }: { pos: LivePosition; stations: Map<string, Station> | null }) {
  const { t } = useTranslation();
  const f = useFormat();
  const time = (d: string | null) => (d ? f.time(d) : '–');
  return (
    <Card>
      <table className="w-full border-collapse text-sm">
        <caption className="mb-2 text-left text-lg font-bold">{t('live.stopsCaption')}</caption>
        <thead>
          <tr className="text-left text-muted">
            <th scope="col" className="py-1 pr-2">{t('live.colStation')}</th>
            <th scope="col" className="py-1 pr-2">{t('live.colScheduled')}</th>
            <th scope="col" className="py-1 pr-2">{t('live.colPredicted')}</th>
            <th scope="col" className="py-1">{t('live.colStatus')}</th>
          </tr>
        </thead>
        <tbody>
          {pos.stops.map((s) => {
            const isNext = s.stationId === pos.nextStopId && !s.passed && pos.status !== 'cancelled';
            const scheduled = s.scheduledDeparture ?? s.scheduledArrival;
            const predicted = s.predictedDeparture ?? s.predictedArrival;
            const late = scheduled && predicted && Date.parse(predicted) > Date.parse(scheduled);
            return (
              <tr key={s.stationId} className={`border-t border-border ${isNext ? 'bg-accent-soft font-semibold' : s.passed ? 'text-muted' : ''}`}>
                <th scope="row" className="py-1.5 pr-2 text-left font-semibold [overflow-wrap:anywhere]">
                  {f.station(stations?.get(s.stationId))}
                </th>
                <td className="py-1.5 pr-2 tabular">{time(scheduled)}</td>
                <td className={`py-1.5 pr-2 tabular ${late ? 'text-warn' : ''}`}>{time(predicted)}</td>
                <td className="py-1.5">{s.passed ? t('live.passed') : isNext ? t('live.next') : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
