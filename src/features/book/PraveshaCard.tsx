import { useTranslation } from 'react-i18next';
import { Card } from '@/components/Card';
import { PRAVESHA_URL } from '@/config/links';
import { PRAVESHA_ADVANCE_DAYS } from '@/config/policy';
import { useFormat } from '@/hooks/useFormat';
import { praveshaWindow } from '@/lib/booking';
import { colomboDateOf } from '@/lib/time';
import type { Trip } from '@/types';
import { OfficialHandoff } from './OfficialHandoff';

/** Commuter (unreserved) tickets. While PRAVESHA_URL is null there is no link, only "Link coming soon". */
export function PraveshaCard({ trip, now, url = PRAVESHA_URL }: { trip: Trip; now: Date; url?: string | null }) {
  const { t } = useTranslation();
  const f = useFormat();
  const unreserved = trip.fares.filter((x) => !x.reservable);
  if (unreserved.length === 0) return null;
  const w = praveshaWindow(trip.date, now);
  const notOnSaleYet = colomboDateOf(now) < w.opensOn;

  return (
    <>
      <Card>
        <section aria-labelledby="pravesha-title" className="grid gap-2">
          <h2 id="pravesha-title" className="text-lg font-bold">
            {t('book.praveshaTitle')}
          </h2>
          <p>{t('book.praveshaClasses', { classes: unreserved.map((x) => t(`classes.${x.travelClass}`)).join(', ') })}</p>
          <p>{t('train.praveshaNote', { days: PRAVESHA_ADVANCE_DAYS })}</p>
          <p className="font-semibold">
            {notOnSaleYet
              ? t('book.praveshaNotYet', { date: f.date(w.opensOn) })
              : t('train.praveshaFrom', { date: f.date(trip.date), opens: f.date(w.opensOn) })}
          </p>
          {!url && (
            <div className="mt-1 grid gap-1">
              {/* Deliberately not a link or button: there is nowhere safe to send people yet. */}
              <p
                aria-disabled="true"
                className="tap flex items-center justify-center rounded-xl border border-dashed border-border px-4 py-2 text-center font-semibold text-muted"
              >
                {t('book.praveshaSoon')}
              </p>
              <p className="text-sm text-muted">{t('book.praveshaSoonBody')}</p>
            </div>
          )}
        </section>
      </Card>
      {url && <OfficialHandoff url={url} buttonLabel={t('book.praveshaContinue')} />}
    </>
  );
}
