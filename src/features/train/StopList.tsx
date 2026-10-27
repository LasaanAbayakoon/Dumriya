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

  return (
    <ol className="relative">
      {train.stops.map((s, i) => {
        const inTrip = i >= fromIdx && i <= toIdx;
        const isBoard = i === fromIdx;
        const isAlight = i === toIdx;
        const main = s.departure ?? s.arrival!;
        const showArr = s.arrival && s.departure && s.arrival !== s.departure;
        return (
          <li key={s.stationId} className={`flex gap-3 ${inTrip ? '' : 'text-muted'}`}>
            <div className="w-16 shrink-0 py-2 text-right tabular">
              <span className={`font-semibold ${isBoard || isAlight ? 'text-lg' : ''}`}>{time(main, s.dayOffset)}</span>
              <DayOffset days={s.dayOffset - boardDay} />
            </div>
            <div className="relative flex w-4 shrink-0 justify-center" aria-hidden="true">
              <span className={`absolute inset-y-0 w-0.5 ${inTrip && i < toIdx ? 'bg-accent' : 'bg-border'}`} />
              <span
                className={`relative mt-3.5 size-3 rounded-full border-2 ${
                  isBoard || isAlight ? 'border-accent bg-accent' : inTrip ? 'border-accent bg-surface' : 'border-border bg-surface'
                }`}
              />
            </div>
            <div className="min-w-0 flex-1 py-2 [overflow-wrap:anywhere]">
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
