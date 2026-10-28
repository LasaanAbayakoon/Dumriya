import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { getTrip } from '@/api';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { ChosenDateTime } from '@/components/ChosenDateTime';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { ChevronRightIcon } from '@/components/icons';
import { CONVENIENCE_FEE_RATE, REFUND_COUNT_FROM_BOARDING_STATION, REFUND_TIERS } from '@/config/policy';
import { useAsync } from '@/hooks/useAsync';
import { useFormat } from '@/hooks/useFormat';
import { useNow } from '@/hooks/useNow';
import { useStations } from '@/hooks/useStations';
import { moneyInput, prefillMoney } from '@/lib/format';
import { defaultServiceCharge, refundQuote, type RefundQuote } from '@/lib/refund';
import { colomboDateOf, colomboDateTime, colomboTimeOf, isClockTime, isIsoDate } from '@/lib/time';

const parseAmount = (s: string): number | null => {
  const n = Number(s.replace(/,/g, '').trim());
  return s.trim() !== '' && Number.isFinite(n) ? n : null;
};

export default function RefundScreen() {
  const { t } = useTranslation();
  const [params] = useSearchParams();

  // Prefill from a train or saved ticket (?departure=…&fare=…&sc=…&train=…).
  const prefill = params.get('departure');
  const prefillDate = prefill && !Number.isNaN(Date.parse(prefill)) ? new Date(prefill) : null;
  const [depDate, setDepDate] = useState(prefillDate ? colomboDateOf(prefillDate) : '');
  const [depTime, setDepTime] = useState(prefillDate ? colomboTimeOf(prefillDate) : '');
  const [fare, setFare] = useState(() => prefillMoney(params.get('fare')));
  // The service charge follows the fare (5 %) until the user edits it.
  const [serviceCharge, setServiceCharge] = useState<string | null>(() => (params.get('sc') === null ? null : prefillMoney(params.get('sc'))));

  const fareN = parseAmount(fare);
  const scText = serviceCharge ?? (fareN !== null && fareN > 0 ? moneyInput(defaultServiceCharge(fareN)) : '');
  const scN = parseAmount(scText);
  const departure = isIsoDate(depDate) && isClockTime(depTime) ? colomboDateTime(depDate, depTime) : null;

  const errors = {
    departure: (depDate || depTime) && !departure ? t('refund.errorDeparture') : null,
    fare: fare.trim() && (fareN === null || fareN <= 0) ? t('refund.errorFare') : null,
    serviceCharge: scText.trim() && (scN === null || scN < 0) ? t('refund.errorServiceCharge') : null,
  };
  const ready = departure && fareN !== null && fareN > 0 && scN !== null && scN >= 0;

  const input = 'tap w-full rounded-xl border bg-surface px-3 py-2 text-lg';
  const border = (err: string | null) => (err ? 'border-danger' : 'border-border');

  return (
    <>
      <PageHeader title={t('screens.refund')} back />
      <div className="mx-auto grid max-w-2xl gap-4 p-4">
        <p>{t('refund.intro')}</p>
        <TripLabel />

        <Card>
          <form noValidate onSubmit={(e) => e.preventDefault()} className="grid gap-3">
            <div className="grid gap-3 min-[400px]:grid-cols-2">
              <div>
                <label htmlFor="refund-date" className="mb-1 block text-sm font-semibold text-muted">
                  {t('refund.departureDate')}
                </label>
                <input
                  id="refund-date"
                  type="date"
                  value={depDate}
                  onChange={(e) => setDepDate(e.target.value)}
                  aria-describedby="refund-dep-hint refund-chosen"
                  aria-invalid={errors.departure ? true : undefined}
                  className={`${input} ${border(errors.departure)}`}
                />
              </div>
              <div>
                <label htmlFor="refund-time" className="mb-1 block text-sm font-semibold text-muted">
                  {t('refund.departureTime')}
                </label>
                <input
                  id="refund-time"
                  type="time"
                  value={depTime}
                  onChange={(e) => setDepTime(e.target.value)}
                  aria-describedby="refund-dep-hint refund-chosen"
                  aria-invalid={errors.departure ? true : undefined}
                  className={`${input} ${border(errors.departure)}`}
                />
              </div>
            </div>
            <p id="refund-dep-hint" className="-mt-2 text-sm text-muted">
              {t('refund.departureHint')}
            </p>
            <ChosenDateTime id="refund-chosen" date={depDate} time={depTime} />
            {errors.departure && <p className="text-sm font-semibold text-danger">{errors.departure}</p>}

            <div>
              <label htmlFor="refund-fare" className="mb-1 block text-sm font-semibold text-muted">
                {t('refund.fare')}
              </label>
              <input
                id="refund-fare"
                type="text"
                inputMode="decimal"
                value={fare}
                onChange={(e) => setFare(e.target.value)}
                aria-describedby={errors.fare ? 'refund-fare-hint refund-fare-err' : 'refund-fare-hint'}
                aria-invalid={errors.fare ? true : undefined}
                className={`${input} ${border(errors.fare)}`}
              />
              <p id="refund-fare-hint" className="mt-1 text-sm text-muted">
                {t('refund.fareHint')}
              </p>
              {errors.fare && (
                <p id="refund-fare-err" className="text-sm font-semibold text-danger">
                  {errors.fare}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="refund-sc" className="mb-1 block text-sm font-semibold text-muted">
                {t('refund.serviceCharge')}
              </label>
              <input
                id="refund-sc"
                type="text"
                inputMode="decimal"
                value={scText}
                onChange={(e) => setServiceCharge(e.target.value)}
                aria-describedby={errors.serviceCharge ? 'refund-sc-hint refund-sc-err' : 'refund-sc-hint'}
                aria-invalid={errors.serviceCharge ? true : undefined}
                className={`${input} ${border(errors.serviceCharge)}`}
              />
              <p id="refund-sc-hint" className="mt-1 text-sm text-muted">
                {t('refund.serviceChargeHint', { percent: CONVENIENCE_FEE_RATE * 100 })}
              </p>
              {errors.serviceCharge && (
                <p id="refund-sc-err" className="text-sm font-semibold text-danger">
                  {errors.serviceCharge}
                </p>
              )}
            </div>
          </form>
        </Card>

        {ready && <RefundResult departure={departure} fare={fareN} serviceCharge={scN} />}
        <HowToRefund />
      </div>
    </>
  );
}

/** "For 1045 Night Mail, Thu, 10 Dec 2026", plus the origin note when the passenger boards later on the route. */
function TripLabel() {
  const { t } = useTranslation();
  const f = useFormat();
  const [params] = useSearchParams();
  const stations = useStations();
  const trainId = params.get('train');
  const date = params.get('date');
  const from = params.get('from') ?? undefined;
  const to = params.get('to') ?? undefined;
  const trip = useAsync(
    () => (trainId && date && isIsoDate(date) ? getTrip({ trainId, date, fromStationId: from, toStationId: to }) : Promise.resolve(null)),
    [trainId, date, from, to],
  );
  if (trip.status !== 'ready' || !trip.data) return null;
  const tr = trip.data;
  const origin = tr.train.stops[0]!;
  const boardsLater = origin.stationId !== tr.from.stationId;
  const originDep = colomboDateTime(tr.serviceDate, origin.departure!, origin.dayOffset);
  return (
    <>
      <p className="font-semibold [overflow-wrap:anywhere]">{t('refund.forTrain', { train: f.train(tr.train), date: f.date(tr.date) })}</p>
      {boardsLater && !REFUND_COUNT_FROM_BOARDING_STATION && (
        <Notice tone="warn" title={t('common.notConfirmed')}>
          {t('refund.originNote', { origin: f.station(stations?.get(origin.stationId)), when: f.dateTime(originDep) })}
        </Notice>
      )}
    </>
  );
}

function tierLabel(t: ReturnType<typeof useTranslation>['t'], i: number): string {
  const last = REFUND_TIERS.length;
  if (i === 0) return t('refund.tierMoreThan', { hours: REFUND_TIERS[0]!.moreThanHours });
  if (i < last) return t('refund.tierBetween', { upper: REFUND_TIERS[i - 1]!.moreThanHours, lower: REFUND_TIERS[i]!.moreThanHours });
  return t('refund.tierLast', { hours: REFUND_TIERS[last - 1]!.moreThanHours });
}

function RefundResult({ departure, fare, serviceCharge }: { departure: Date; fare: number; serviceCharge: number }) {
  const { t } = useTranslation();
  const f = useFormat();
  const now = useNow(1000);
  const q: RefundQuote = refundQuote({ departure, fareLkr: fare, serviceChargeLkr: serviceCharge }, now);
  const nextPercent = q.nextDropAt ? q.tiers.find((x) => x.from?.getTime() === q.nextDropAt!.getTime())?.percent : undefined;
  const lastHours = REFUND_TIERS[REFUND_TIERS.length - 1]!.moreThanHours;

  return (
    <>
      <Card>
        <section aria-labelledby="refund-now" className="grid gap-2">
          <h2 id="refund-now" className="text-lg font-bold">
            {t('refund.nowTitle')}
          </h2>
          {q.departed ? (
            <p className="text-lg font-semibold">{t('refund.departed')}</p>
          ) : q.percent === 0 ? (
            <p className="text-lg font-semibold">{t('refund.zeroNow', { hours: lastHours })}</p>
          ) : (
            <>
              <p className="text-2xl font-bold" data-testid="refund-amount">
                {t('refund.youGet', { amount: f.lkr(q.refundLkr) })}
              </p>
              <p className="font-semibold text-accent">{t('refund.percentOfFare', { percent: q.percent })}</p>
            </>
          )}
          <p className="text-sm">{t('refund.notRefunded', { amount: f.lkr(q.notRefundedLkr), sc: f.lkr(q.serviceChargeLkr) })}</p>
          {q.nextDropAt && nextPercent !== undefined && (
            <p className="rounded-xl bg-surface-2 p-3 font-semibold" aria-live="off" data-testid="refund-countdown">
              {t('refund.nextDrop', { percent: nextPercent, time: f.countdown(q.nextDropAt.getTime() - now.getTime()) })}{' '}
              <span className="font-normal">{t('refund.nextDropAt', { when: f.dateTime(q.nextDropAt) })}</span>
            </p>
          )}
        </section>
      </Card>

      <Card>
        <section aria-labelledby="refund-timeline" className="grid gap-3">
          <h2 id="refund-timeline" className="text-lg font-bold">
            {t('refund.timelineTitle')}
          </h2>
          <ol className="grid gap-2">
            {q.tiers.map((tier, i) => {
              const current = !q.departed && tier.percent === q.percent;
              const window =
                tier.from && tier.until
                  ? t('refund.fromUntil', { from: f.dateTime(tier.from), until: f.dateTime(tier.until) })
                  : tier.until
                    ? t('refund.until', { when: f.dateTime(tier.until) })
                    : t('refund.from', { when: f.dateTime(tier.from!) });
              return (
                <li
                  key={tier.percent}
                  className={`flex gap-3 rounded-xl border p-3 ${current ? 'border-accent bg-accent-soft' : 'border-border'}`}
                  aria-current={current ? 'step' : undefined}
                >
                  <span className="w-14 shrink-0 text-2xl font-bold tabular">{tier.percent} %</span>
                  <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                    <span className="block font-semibold">{tierLabel(t, i)}</span>
                    <span className="block text-sm">{window}</span>
                    {current && (
                      <Badge tone="accent" className="mt-1">
                        {t('refund.now')}
                      </Badge>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="text-sm text-muted">
            {t('refund.boundaryNote', { hours: REFUND_TIERS[0]!.moreThanHours, percent: q.tiers[1]?.percent ?? 0 })}
          </p>
          <p className="text-sm text-muted">{t('refund.allTimesSL')}</p>
        </section>
      </Card>
    </>
  );
}

function HowToRefund() {
  const { t } = useTranslation();
  return (
    <Card>
      <section aria-labelledby="refund-how" className="grid gap-2">
        <h2 id="refund-how" className="text-lg font-bold">
          {t('refund.howTitle')}
        </h2>
        <p className="font-semibold">{t('refund.howInPerson')}</p>
        <p>{t('refund.howDocs')}</p>
        <Link to="/stations" className="tap inline-flex items-center gap-1 font-semibold text-accent underline">
          {t('refund.findStations')}
          <ChevronRightIcon className="shrink-0" />
        </Link>
      </section>
    </Card>
  );
}
