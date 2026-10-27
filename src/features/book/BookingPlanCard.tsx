import { useTranslation } from 'react-i18next';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { StationPicker } from '@/components/StationPicker';
import { Stepper } from '@/components/Stepper';
import { MAX_SEATS_PER_BOOKING } from '@/config/policy';
import { useFormat } from '@/hooks/useFormat';
import { planBookings } from '@/lib/booking';
import type { Station, Trip } from '@/types';

export const MAX_PASSENGERS = 50;

export interface PlanState {
  passengers: number;
  hasReturn: boolean;
  returnPassengers: number;
  returnFromId: string;
}

export function BookingPlanCard({
  trip,
  stations,
  state,
  onChange,
}: {
  trip: Trip;
  stations: Map<string, Station> | null;
  state: PlanState;
  onChange: (s: PlanState) => void;
}) {
  const { t } = useTranslation();
  const f = useFormat();
  const set = (patch: Partial<PlanState>) => onChange({ ...state, ...patch });

  const plan = planBookings(
    { passengers: state.passengers, boardingStationId: trip.from.stationId, alightingStationId: trip.to.stationId },
    state.hasReturn
      ? { passengers: state.returnPassengers, boardingStationId: state.returnFromId, alightingStationId: trip.from.stationId }
      : null,
  );
  const combined = state.hasReturn && plan.separateReturnReasons.length === 0;
  const lines = [
    ...plan.outboundGroups.map((count, i) => t(combined ? 'book.groupBoth' : 'book.groupOut', { n: i + 1, count })),
    ...(state.hasReturn && !combined
      ? plan.returnGroups.map((count, i) => t('book.groupReturn', { n: plan.outboundGroups.length + i + 1, count }))
      : []),
  ];

  return (
    <Card>
      <section aria-labelledby="plan-title" className="grid gap-3">
        <h2 id="plan-title" className="text-lg font-bold">
          {t('book.bookingsTitle')}
        </h2>
        <Notice tone="warn">{t('book.maxSeats', { max: MAX_SEATS_PER_BOOKING })}</Notice>

        <Stepper
          label={t('book.passengers')}
          value={state.passengers}
          min={1}
          max={MAX_PASSENGERS}
          onChange={(n) => set({ passengers: n })}
          decreaseLabel={t('book.fewer')}
          increaseLabel={t('book.more')}
        />

        <label className="tap flex items-start gap-3 rounded-xl border border-border p-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
          <input
            type="checkbox"
            checked={state.hasReturn}
            onChange={(e) => set({ hasReturn: e.target.checked, returnPassengers: state.passengers })}
            className="mt-1 size-5 shrink-0 accent-[var(--accent)]"
          />
          <span className="[overflow-wrap:anywhere]">{t('book.addReturn')}</span>
        </label>

        {state.hasReturn && (
          <div className="grid gap-3 border-l-4 border-accent-soft pl-3">
            <Stepper
              label={t('book.returnPassengers')}
              value={state.returnPassengers}
              min={1}
              max={MAX_PASSENGERS}
              onChange={(n) => set({ returnPassengers: n })}
              decreaseLabel={t('book.fewer')}
              increaseLabel={t('book.more')}
            />
            <StationPicker
              id="return-from"
              label={t('book.returnFrom')}
              dialogTitle={t('book.returnFromTitle')}
              value={stations?.get(state.returnFromId) ?? null}
              onChange={(s) => set({ returnFromId: s.id })}
            />
          </div>
        )}

        <div aria-live="polite" className="rounded-xl bg-surface-2 p-3">
          <p className="text-lg font-bold">{t('book.bookingsNeeded', { count: plan.totalBookings })}</p>
          <ul className="mt-1 grid gap-0.5">
            {lines.map((line) => (
              <li key={line} className="[overflow-wrap:anywhere]">
                {line}
              </li>
            ))}
          </ul>
          {state.hasReturn && combined && <p className="mt-2 text-sm">{t('book.sameReturn')}</p>}
          {plan.separateReturnReasons.includes('different-passengers') && <p className="mt-2 text-sm">{t('book.reasonPassengers')}</p>}
          {plan.separateReturnReasons.includes('different-boarding-station') && (
            <p className="mt-2 text-sm">{t('book.reasonStation', { station: f.station(stations?.get(trip.to.stationId)) })}</p>
          )}
        </div>
      </section>
    </Card>
  );
}
