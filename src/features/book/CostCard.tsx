import { useTranslation } from 'react-i18next';
import { Card } from '@/components/Card';
import { CONVENIENCE_FEE_RATE } from '@/config/policy';
import { useFormat } from '@/hooks/useFormat';
import { trueTotal } from '@/lib/booking';
import type { Fare, TravelClass } from '@/types';

export function CostCard({
  fares,
  travelClass,
  onClassChange,
  seats,
  hasReturn,
}: {
  fares: Fare[];
  travelClass: TravelClass;
  onClassChange: (c: TravelClass) => void;
  seats: number;
  hasReturn: boolean;
}) {
  const { t } = useTranslation();
  const f = useFormat();
  const reservable = fares.filter((x) => x.reservable);
  const fare = reservable.find((x) => x.travelClass === travelClass) ?? reservable[0];
  if (!fare) return null;
  const total = trueTotal(fare.amountLkr, seats);

  return (
    <Card>
      <section aria-labelledby="cost-title" className="grid gap-3">
        <h2 id="cost-title" className="text-lg font-bold">
          {t('book.costTitle')}
        </h2>
        <fieldset>
          <legend className="mb-1 text-sm font-semibold text-muted">{t('book.travelClass')}</legend>
          <div className="grid gap-2">
            {reservable.map((x) => (
              <label
                key={x.travelClass}
                className="tap flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border px-3 py-2 has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
              >
                <input
                  type="radio"
                  name="travel-class"
                  checked={x.travelClass === fare.travelClass}
                  onChange={() => onClassChange(x.travelClass)}
                  className="size-5 shrink-0 accent-[var(--accent)]"
                />
                {/* With large text the price wraps onto its own line instead of squeezing the class name. */}
                <span className="min-w-0 flex-[1_1_6em] font-semibold">{t(`classes.${x.travelClass}`)}</span>
                <span className="ms-auto tabular whitespace-nowrap">{f.lkr(x.amountLkr)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <dl className="grid gap-1" aria-live="polite">
          <div className="flex justify-between gap-2">
            <dt>{t('book.fareLine', { fare: f.lkr(fare.amountLkr), count: seats })}</dt>
            <dd className="tabular whitespace-nowrap">{f.lkr(total.fareTotalLkr)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>{t('book.feeLine', { percent: CONVENIENCE_FEE_RATE * 100 })}</dt>
            <dd className="tabular whitespace-nowrap">{f.lkr(total.convenienceFeeLkr)}</dd>
          </div>
          <div className="flex justify-between gap-2 border-t border-border pt-2 text-lg font-bold">
            <dt>{t('book.totalLine')}</dt>
            <dd className="tabular whitespace-nowrap" data-testid="true-total">
              {f.lkr(total.totalLkr)}
            </dd>
          </div>
        </dl>
        {hasReturn && <p className="text-sm text-muted">{t('book.returnExtra')}</p>}
        <p className="font-semibold">{t('book.payment')}</p>
      </section>
    </Card>
  );
}
