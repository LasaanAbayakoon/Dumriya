import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/Badge';
import { useFormat } from '@/hooks/useFormat';
import { PRAVESHA_ADVANCE_DAYS } from '@/config/policy';
import { colomboDateOf } from '@/lib/time';
import { trainUrl } from '@/lib/urls';
import type { Trip } from '@/types';
import { DayOffset } from '../train/DayOffset';

export function TrainCard({ trip }: { trip: Trip }) {
  const { t } = useTranslation();
  const f = useFormat();
  const cheapest = Math.min(...trip.fares.map((x) => x.amountLkr));
  const arrivalDays = Math.round(
    (Date.parse(colomboDateOf(new Date(trip.arrival))) - Date.parse(colomboDateOf(new Date(trip.departure)))) / 86_400_000,
  );

  return (
    <Link
      to={trainUrl(trip.train.id, { date: trip.date, from: trip.from.stationId, to: trip.to.stationId })}
      className="block rounded-2xl border border-border bg-surface p-4 hover:border-accent"
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-2xl font-bold tabular">
          <span className="sr-only">{t('train.departs')} </span>
          {f.time(trip.departure)}
        </span>
        <span aria-hidden="true" className="text-muted">
          →
        </span>
        <span className="text-2xl font-bold tabular">
          <span className="sr-only">{t('train.arrives')} </span>
          {f.time(trip.arrival)}
          <DayOffset days={arrivalDays} />
        </span>
        <span className="ml-auto text-muted">
          <span className="sr-only">{t('train.duration')} </span>
          {f.duration(trip.durationMin)}
        </span>
      </div>

      <h2 className="mt-1 font-semibold [overflow-wrap:anywhere]">{f.train(trip.train)}</h2>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {trip.reservableOnline ? (
          <Badge tone="accent">{t('train.reservableOnline')}</Badge>
        ) : (
          <Badge>{t('train.unreservedOnly')}</Badge>
        )}
        <span className="sr-only">{t('train.classes')}:</span>
        {trip.fares.map((fare) => (
          <span key={fare.travelClass} className="rounded-md border border-border px-1.5 text-sm text-muted">
            {t(`classesShort.${fare.travelClass}`)}
          </span>
        ))}
        <span className="ml-auto font-semibold">{t('results.fromPrice', { price: f.lkr(cheapest) })}</span>
      </div>

      {!trip.reservableOnline && <p className="mt-2 text-sm text-muted">{t('train.praveshaNote', { days: PRAVESHA_ADVANCE_DAYS })}</p>}
    </Link>
  );
}
