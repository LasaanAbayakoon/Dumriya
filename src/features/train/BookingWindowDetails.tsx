import { useTranslation } from 'react-i18next';
import { Notice } from '@/components/Notice';
import { BOOKING_CLOSE_HOURS_BEFORE, BOOKING_WINDOW_DAYS } from '@/config/policy';
import { useFormat } from '@/hooks/useFormat';
import type { BookingWindow, BookingWindowStatus } from '@/lib/bookingWindow';
import { DAY, HOUR, MINUTE } from '@/lib/time';
import type { Station, Trip } from '@/types';

const statusStyle: Record<BookingWindowStatus, string> = {
  'not-yet-open': 'text-text',
  'opens-today': 'text-text',
  'may-be-open': 'text-text',
  open: 'text-accent',
  closed: 'text-muted',
};

/**
 * Status, opening and closing of the booking window. Every uncertain value is
 * spelled out in words: the unconfirmed opening time, the two possible opening
 * dates and the "may be later from your station" closing time.
 */
export function BookingWindowDetails({
  trip,
  window: w,
  stations,
  now,
}: {
  trip: Trip;
  window: BookingWindow;
  stations: Map<string, Station> | null;
  now: Date;
}) {
  const { t } = useTranslation();
  const f = useFormat();
  const origin = f.station(stations?.get(trip.train.stops[0]!.stationId));
  const boarding = f.station(stations?.get(trip.from.stationId));

  const countdown = (() => {
    if (!w.opensAt || w.status !== 'not-yet-open') return null;
    const ms = w.opensAt.getTime() - now.getTime();
    const d = Math.floor(ms / DAY);
    const h = Math.floor((ms % DAY) / HOUR);
    const m = Math.floor((ms % HOUR) / MINUTE);
    return t('bookingWindow.countdown', { time: d > 0 ? t('format.countdownDhm', { d, h, m }) : f.duration(h * 60 + m) });
  })();

  return (
    <div className="grid gap-3">
      <p className={`font-semibold ${statusStyle[w.status]}`} aria-live="polite">
        {t(`bookingWindow.status.${w.status}`)}
      </p>
      <dl className="grid gap-3">
        <div>
          <dt className="text-sm font-semibold text-muted">{t('bookingWindow.opens')}</dt>
          <dd className="text-lg font-semibold [overflow-wrap:anywhere]">
            {w.altOpensOn
              ? t('bookingWindow.twoDates', { early: f.date(w.opensOn), late: f.date(w.altOpensOn) })
              : w.opensAt
                ? t('bookingWindow.opensAt', { date: f.date(w.opensOn), time: f.time(w.opensAt) })
                : t('bookingWindow.opensOn', { date: f.date(w.opensOn) })}
          </dd>
          {countdown && <dd className="font-semibold text-accent">{countdown}</dd>}
          {!w.timeConfirmed && (
            <dd className="mt-2">
              <Notice title={t('common.notConfirmed')}>{t('bookingWindow.timeNotConfirmed', { days: BOOKING_WINDOW_DAYS })}</Notice>
            </dd>
          )}
          {w.altOpensOn && (
            <dd className="mt-2">
              <Notice tone="warn" title={t('common.notConfirmed')}>
                {t('bookingWindow.twoDatesWhy', {
                  origin,
                  serviceDate: f.date(trip.serviceDate),
                  boardingDate: f.date(trip.date),
                  early: f.date(w.opensOn),
                })}
              </Notice>
            </dd>
          )}
        </div>
        <div>
          <dt className="text-sm font-semibold text-muted">{t('bookingWindow.closes')}</dt>
          <dd className="text-lg font-semibold [overflow-wrap:anywhere]">
            {t('bookingWindow.closesAt', { time: f.time(w.closesAt), date: f.date(w.closesAt) })}
            {w.closesMayBeLater && <span className="font-normal"> {t('bookingWindow.mayBeLater')}</span>}
          </dd>
          {w.closesMayBeLater && (
            <dd className="mt-1 text-sm text-muted">
              {t('bookingWindow.mayBeLaterWhy', { hours: BOOKING_CLOSE_HOURS_BEFORE, origin, station: boarding })}
            </dd>
          )}
        </div>
      </dl>
    </div>
  );
}
