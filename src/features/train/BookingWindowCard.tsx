import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ButtonLink } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { BellIcon } from '@/components/icons';
import { BOOKING_CLOSE_HOURS_BEFORE, BOOKING_WINDOW_DAYS } from '@/config/policy';
import { useFormat } from '@/hooks/useFormat';
import { useNow } from '@/hooks/useNow';
import { bookingWindowForTrip, type BookingWindowStatus } from '@/lib/bookingWindow';
import { DAY, HOUR, MINUTE } from '@/lib/time';
import { bookUrl } from '@/lib/urls';
import type { Station, Trip } from '@/types';
import { ReminderSheet } from './ReminderSheet';

const statusStyle: Record<BookingWindowStatus, string> = {
  'not-yet-open': 'text-text',
  'opens-today': 'text-text',
  'may-be-open': 'text-text',
  open: 'text-accent',
  closed: 'text-muted',
};

/**
 * Booking window for one trip. Every uncertain value is spelled out in words:
 * the unconfirmed opening time, the two possible opening dates and the
 * "may be later from your station" closing time.
 */
export function BookingWindowCard({ trip, stations }: { trip: Trip; stations: Map<string, Station> | null }) {
  const { t } = useTranslation();
  const f = useFormat();
  const now = useNow(30_000);
  const [sheetOpen, setSheetOpen] = useState(false);
  const w = bookingWindowForTrip(trip, now);

  const origin = f.station(stations?.get(trip.train.stops[0]!.stationId));
  const boarding = f.station(stations?.get(trip.from.stationId));
  const canRemind = w.status === 'not-yet-open' || w.status === 'opens-today';

  const countdown = (() => {
    if (!w.opensAt || w.status !== 'not-yet-open') return null;
    const ms = w.opensAt.getTime() - now.getTime();
    const d = Math.floor(ms / DAY);
    const h = Math.floor((ms % DAY) / HOUR);
    const m = Math.floor((ms % HOUR) / MINUTE);
    return t('bookingWindow.countdown', { time: d > 0 ? t('format.countdownDhm', { d, h, m }) : f.duration(h * 60 + m) });
  })();

  return (
    <Card>
      <section aria-labelledby="bw-title" className="grid gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="bw-title" className="text-lg font-bold">
            {t('bookingWindow.title')}
          </h2>
          <p className={`font-semibold ${statusStyle[w.status]}`} aria-live="polite">
            {t(`bookingWindow.status.${w.status}`)}
          </p>
        </div>

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

        <div className="grid gap-2">
          {canRemind && (
            <Button size="lg" icon={<BellIcon />} onClick={() => setSheetOpen(true)}>
              {t('bookingWindow.remindMe')}
            </Button>
          )}
          {w.status !== 'closed' && (
            <ButtonLink
              to={bookUrl(trip.train.id, { date: trip.date, from: trip.from.stationId, to: trip.to.stationId })}
              size="lg"
              variant={canRemind ? 'secondary' : 'primary'}
            >
              {t('train.beforeYouBook')}
            </ButtonLink>
          )}
        </div>
      </section>
      {sheetOpen && <ReminderSheet trip={trip} window={w} onClose={() => setSheetOpen(false)} />}
    </Card>
  );
}
