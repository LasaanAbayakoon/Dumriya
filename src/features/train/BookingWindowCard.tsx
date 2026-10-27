import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ButtonLink } from '@/components/Button';
import { Card } from '@/components/Card';
import { BellIcon } from '@/components/icons';
import { useNow } from '@/hooks/useNow';
import { bookingWindowForTrip } from '@/lib/bookingWindow';
import { bookUrl } from '@/lib/urls';
import type { Station, Trip } from '@/types';
import { BookingWindowDetails } from './BookingWindowDetails';
import { ReminderSheet } from './ReminderSheet';

export function BookingWindowCard({ trip, stations }: { trip: Trip; stations: Map<string, Station> | null }) {
  const { t } = useTranslation();
  const now = useNow(30_000);
  const [sheetOpen, setSheetOpen] = useState(false);
  const w = bookingWindowForTrip(trip, now);
  const canRemind = w.status === 'not-yet-open' || w.status === 'opens-today';

  return (
    <Card>
      <section aria-labelledby="bw-title" className="grid gap-3">
        <h2 id="bw-title" className="text-lg font-bold">
          {t('bookingWindow.title')}
        </h2>
        <BookingWindowDetails trip={trip} window={w} stations={stations} now={now} />
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
