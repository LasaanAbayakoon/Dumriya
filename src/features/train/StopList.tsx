import { useTranslation } from 'react-i18next';
import { useFormat } from '@/hooks/useFormat';
import { colomboDateTime } from '@/lib/time';
import type { IsoDate, Station, Train } from '@/types';
import { DayOffset } from './DayOffset';

type Props = {
  train: Train;
  serviceDate: IsoDate;
  /** Indexes of the passenger's boarding and alighting stops (whole route if omitted). */
  fromIdx?: number;
  toIdx?: number;
  stations: Map<string, Station> | null;
};

export function StopList({ train, serviceDate, fromIdx = 0, toIdx = train.stops.length - 1, stations }: Props) {
  const { t } = useTranslation();
  const f = useFormat();
  const boardDay = train.stops[fromIdx]?.dayOffset ?? 0;
  const time = (hhmm: string, dayOffset: number) => f.time(colomboDateTime(serviceDate, hhmm, dayOffset));

  // Large text: when the list is narrower than 18rem, the time moves above the station name
  // (same DOM order, so screen readers still hear time, then station).
  return (
    <ol className="@container relative">
      {train.stops.map((s, i) => {
        const inTrip = i >= fromIdx && i <= toIdx;
        const isBoard = i === fromIdx;
        const isAlight = i === toIdx;
        const main = s.departure ?? s.arrival!;
        const showArr = s.arrival && s.departure && s.arrival !== s.departure;
        return (
          <li
            key={s.stationId}
            className={`grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3 @min-[18rem]:grid-cols-[4rem_1rem_minmax(0,1fr)] ${inTrip ? '' : 'text-muted'}`}
          >
            <div className="col-start-2 row-start-1 pt-2 tabular @min-[18rem]:col-start-1 @min-[18rem]:pb-2 @min-[18rem]:text-right">
              <span className={`font-semibold ${isBoard || isAlight ? 'text-lg' : ''}`}>{time(main, s.dayOffset)}</span>
              <DayOffset days={s.dayOffset - boardDay} />
            </div>
            <div className="relative col-start-1 row-span-2 row-start-1 flex justify-center @min-[18rem]:col-start-2 @min-[18rem]:row-span-1" aria-hidden="true">
              <span className={`absolute inset-y-0 w-0.5 ${inTrip && i < toIdx ? 'bg-accent' : 'bg-border'}`} />
              <span
                className={`relative mt-3.5 size-3 rounded-full border-2 ${
                  isBoard || isAlight ? 'border-accent bg-accent' : inTrip ? 'border-accent bg-surface' : 'border-border bg-surface'
                }`}
              />
            </div>
            <div className="col-start-2 row-start-2 pb-2 @min-[18rem]:col-start-3 @min-[18rem]:row-start-1 @min-[18rem]:pt-2">
              <p className={isBoard || isAlight ? 'text-lg font-bold' : 'font-semibold'}>{f.station(stations?.get(s.stationId))}</p>
              <p className="text-sm text-muted">
                {isBoard && <span className="font-semibold text-accent">{t('train.youBoard')}. </span>}
                {isAlight && <span className="font-semibold text-accent">{t('train.youGetOff')}. </span>}
                {showArr && (
                  <span>
                    {t('train.arr')} {time(s.arrival!, s.dayOffset)} · {t('train.dep')} {time(s.departure!, s.dayOffset)}
                  </span>
                )}
                {!s.departure && <span className="sr-only">{t('train.arr')}</span>}
                {s.platform && <span>{showArr ? ' · ' : ''}{t('train.platform', { platform: s.platform })}</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
