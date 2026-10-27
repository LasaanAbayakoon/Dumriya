import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { getTrip } from '@/api';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CopyButton } from '@/components/CopyButton';
import { Loading } from '@/components/Loading';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { OFFICIAL_RESERVATION_URL } from '@/config/links';
import { useAsync } from '@/hooks/useAsync';
import { useFormat } from '@/hooks/useFormat';
import { useNow } from '@/hooks/useNow';
import { useStations } from '@/hooks/useStations';
import { bookingWindowForTrip } from '@/lib/bookingWindow';
import { isIsoDate, todayInColombo } from '@/lib/time';
import type { Station, TravelClass, Trip } from '@/types';
import { BookingWindowDetails } from '../train/BookingWindowDetails';
import { BookingPlanCard, type PlanState } from './BookingPlanCard';
import { Checklist } from './Checklist';
import { CostCard } from './CostCard';
import { OfficialHandoff } from './OfficialHandoff';
import { PraveshaCard } from './PraveshaCard';

export default function BookingHelperScreen() {
  const { t } = useTranslation();
  const { trainId = '' } = useParams();
  const [params] = useSearchParams();
  const today = useMemo(() => todayInColombo(), []);
  const rawDate = params.get('date');
  const date = rawDate && isIsoDate(rawDate) ? rawDate : today;
  const from = params.get('from') ?? undefined;
  const to = params.get('to') ?? undefined;
  const stations = useStations();
  const data = useAsync(() => getTrip({ trainId, date, fromStationId: from, toStationId: to }), [trainId, date, from, to]);

  const header = <PageHeader title={t('screens.book')} back sampleData />;
  if (data.status === 'loading') {
    return (
      <>
        {header}
        <Loading />
      </>
    );
  }
  if (data.status === 'error' || !data.data) {
    return (
      <>
        {header}
        <div className="mx-auto max-w-2xl p-4">
          <Notice tone="danger">
            <p>{data.status === 'error' ? t('common.error') : t('train.notFound')}</p>
            {data.status === 'error' && (
              <Button variant="secondary" className="mt-2" onClick={data.reload}>
                {t('common.retry')}
              </Button>
            )}
          </Notice>
        </div>
      </>
    );
  }
  return (
    <>
      {header}
      <BookingHelper key={`${trainId}-${date}-${from}-${to}`} trip={data.data} stations={stations} />
    </>
  );
}

function BookingHelper({ trip, stations }: { trip: Trip; stations: Map<string, Station> | null }) {
  const { t } = useTranslation();
  const f = useFormat();
  const now = useNow(30_000);
  const [plan, setPlan] = useState<PlanState>({
    passengers: 1,
    hasReturn: false,
    returnPassengers: 1,
    returnFromId: trip.to.stationId,
  });
  const firstReservable = trip.fares.find((x) => x.reservable)?.travelClass ?? 'second';
  const [travelClass, setTravelClass] = useState<TravelClass>(firstReservable);

  const fromName = f.station(stations?.get(trip.from.stationId));
  const toName = f.station(stations?.get(trip.to.stationId));
  const tripText = t('book.tripText', {
    train: f.train(trip.train),
    from: fromName,
    to: toName,
    date: f.date(trip.date),
    time: f.time(trip.departure),
  });
  const w = trip.reservableOnline ? bookingWindowForTrip(trip, now) : null;

  return (
    <div className="mx-auto grid max-w-2xl gap-4 p-4">
      <Card>
        <section aria-labelledby="trip-title" className="grid gap-2">
          <h2 id="trip-title" className="text-lg font-bold">
            {t('book.tripTitle')}
          </h2>
          <p className="font-semibold [overflow-wrap:anywhere]">{tripText}</p>
          <p className="text-sm text-muted">{t('book.searchHint')}</p>
          <CopyButton text={tripText} label={t('book.copyTrip')} />
        </section>
      </Card>

      {w && (
        <>
          <Card>
            <section aria-labelledby="bw-title" className="grid gap-3">
              <h2 id="bw-title" className="text-lg font-bold">
                {t('bookingWindow.title')}
              </h2>
              <BookingWindowDetails trip={trip} window={w} stations={stations} now={now} />
              {(w.status === 'not-yet-open' || w.status === 'opens-today') && <Notice>{t('book.notOpenYet')}</Notice>}
              {w.status === 'closed' && <Notice tone="warn">{t('book.closed')}</Notice>}
            </section>
          </Card>
          <BookingPlanCard trip={trip} stations={stations} state={plan} onChange={setPlan} />
          <CostCard
            fares={trip.fares}
            travelClass={travelClass}
            onClassChange={setTravelClass}
            seats={plan.passengers}
            hasReturn={plan.hasReturn}
          />
          <Checklist />
          <OfficialHandoff url={OFFICIAL_RESERVATION_URL} buttonLabel={t('book.continueOfficial')} />
        </>
      )}

      {!trip.reservableOnline && <Notice title={t('train.unreservedTitle')}>{t('train.unreservedBody')}</Notice>}
      <PraveshaCard trip={trip} now={now} />
    </div>
  );
}
