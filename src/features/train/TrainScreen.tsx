import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { getTrain, getTrip } from '@/api';
import { Badge } from '@/components/Badge';
import { Button, ButtonLink } from '@/components/Button';
import { Card } from '@/components/Card';
import { Loading } from '@/components/Loading';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { ChevronRightIcon, MapIcon } from '@/components/icons';
import { PRAVESHA_ADVANCE_DAYS } from '@/config/policy';
import { useAsync } from '@/hooks/useAsync';
import { useFormat } from '@/hooks/useFormat';
import { useStations } from '@/hooks/useStations';
import { praveshaWindow } from '@/lib/booking';
import { isIsoDate, todayInColombo, toColomboIso } from '@/lib/time';
import { refundDepartureForTrip } from '@/lib/refund';
import { liveUrl, refundUrl } from '@/lib/urls';
import { BookingWindowCard } from './BookingWindowCard';
import { DayOffset } from './DayOffset';
import { FareTable } from './FareTable';
import { RunningDays } from './RunningDays';
import { StopList } from './StopList';

export default function TrainScreen() {
  const { t } = useTranslation();
  const f = useFormat();
  const { trainId = '' } = useParams();
  const [params] = useSearchParams();
  const stations = useStations();
  const today = useMemo(() => todayInColombo(), []);
  const rawDate = params.get('date');
  const date = rawDate && isIsoDate(rawDate) ? rawDate : today;
  const from = params.get('from') ?? undefined;
  const to = params.get('to') ?? undefined;

  const data = useAsync(
    () => Promise.all([getTrip({ trainId, date, fromStationId: from, toStationId: to }), getTrain(trainId)]),
    [trainId, date, from, to],
  );

  if (data.status === 'loading') {
    return (
      <>
        <PageHeader title={t('screens.train')} back sampleData />
        <Loading />
      </>
    );
  }
  if (data.status === 'error') {
    return (
      <>
        <PageHeader title={t('screens.train')} back sampleData />
        <div className="mx-auto max-w-2xl p-4">
          <Notice tone="danger">
            <p>{t('common.error')}</p>
            <Button variant="secondary" className="mt-2" onClick={data.reload}>
              {t('common.retry')}
            </Button>
          </Notice>
        </div>
      </>
    );
  }

  const [trip, train] = data.data;
  if (!train) {
    return (
      <>
        <PageHeader title={t('screens.train')} back sampleData />
        <div className="mx-auto max-w-2xl p-4">
          <Notice tone="warn">{t('train.notFound')}</Notice>
        </div>
      </>
    );
  }

  const title = f.train(train);

  if (!trip) {
    return (
      <>
        <PageHeader title={title} back sampleData />
        <div className="mx-auto grid max-w-2xl gap-4 p-4">
          <Notice tone="warn">{t('train.notRunning', { date: f.date(date) })}</Notice>
          <Card>
            <h2 className="mb-2 text-lg font-bold">{t('train.runningDays')}</h2>
            <RunningDays days={train.runningDays} />
          </Card>
        </div>
      </>
    );
  }

  const fromIdx = train.stops.findIndex((s) => s.stationId === trip.from.stationId);
  const toIdx = train.stops.findIndex((s) => s.stationId === trip.to.stationId);
  const fromName = f.station(stations?.get(trip.from.stationId));
  const toName = f.station(stations?.get(trip.to.stationId));
  const arrivalDays = trip.to.dayOffset - trip.from.dayOffset;
  const pravesha = praveshaWindow(trip.date);

  return (
    <>
      <PageHeader title={title} back sampleData />
      <div className="mx-auto grid max-w-2xl gap-4 p-4">
        <Card>
          <p className="font-semibold [overflow-wrap:anywhere]">{t('results.route', { from: fromName, to: toName })}</p>
          <p className="text-muted">{f.date(trip.date)}</p>
          <dl className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2">
            <div>
              <dt className="text-sm text-muted">{t('train.departs')}</dt>
              <dd className="text-2xl font-bold tabular">{f.time(trip.departure)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">{t('train.arrives')}</dt>
              <dd className="text-2xl font-bold tabular">
                {f.time(trip.arrival)}
                <DayOffset days={arrivalDays} />
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">{t('train.duration')}</dt>
              <dd className="font-semibold">{f.duration(trip.durationMin)}</dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {trip.reservableOnline ? (
              <Badge tone="accent">{t('train.reservableOnline')}</Badge>
            ) : (
              <Badge>{t('train.unreservedOnly')}</Badge>
            )}
          </div>
        </Card>

        {trip.reservableOnline ? (
          <BookingWindowCard trip={trip} stations={stations} />
        ) : (
          <Card>
            <h2 className="mb-2 text-lg font-bold">{t('train.unreservedTitle')}</h2>
            <p>{t('train.unreservedBody')}</p>
            <p className="mt-2">{t('train.praveshaNote', { days: PRAVESHA_ADVANCE_DAYS })}</p>
            <p className="mt-1 font-semibold">
              {t('train.praveshaFrom', { date: f.date(trip.date), opens: f.date(pravesha.opensOn) })}
            </p>
          </Card>
        )}

        <Card>
          <h2 className="mb-2 text-lg font-bold">{t('train.fares')}</h2>
          <FareTable fares={trip.fares} fromName={fromName} toName={toName} />
          {trip.reservableOnline && (
            <Link
              to={refundUrl({
                departure: toColomboIso(refundDepartureForTrip(trip)),
                fare: trip.fares.find((x) => x.reservable)?.amountLkr,
                trainId: trip.train.id,
                date: trip.date,
                from: trip.from.stationId,
                to: trip.to.stationId,
              })}
              className="tap mt-2 inline-flex items-center gap-1 font-semibold text-accent underline"
            >
              {t('train.refundLink')}
              <ChevronRightIcon className="shrink-0" />
            </Link>
          )}
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-bold">{t('train.runningDays')}</h2>
          <RunningDays days={train.runningDays} />
        </Card>

        <Card>
          <h2 className="mb-1 text-lg font-bold">{t('train.stops')}</h2>
          <StopList train={train} serviceDate={trip.serviceDate} fromIdx={fromIdx} toIdx={toIdx} stations={stations} />
        </Card>

        <ButtonLink to={liveUrl(train.id, { date: trip.serviceDate })} variant="secondary" icon={<MapIcon />}>
          {t('train.liveMap')} · {t('common.preview')}
        </ButtonLink>
      </div>
    </>
  );
}
