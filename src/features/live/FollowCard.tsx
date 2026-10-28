import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getFollowEvents } from '@/api';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { BellIcon, CheckIcon } from '@/components/icons';
import { FOLLOW_DELAY_DEFAULT, FOLLOW_DELAY_OPTIONS } from '@/config/app';
import { useAsync } from '@/hooks/useAsync';
import { useFormat } from '@/hooks/useFormat';
import { announceRemindersChanged } from '@/lib/reminderEvents';
import { followReminder, followReminderId } from '@/lib/reminders';
import { reminders } from '@/lib/storage';
import type { FollowEvent, IsoDate, Station, Train } from '@/types';

/**
 * Follow a train: alerts for a delay over N minutes and/or cancellation, delivered by the
 * Stage 7 reminder engine. In the preview the events come from the simulation.
 */
export function FollowCard({
  train,
  serviceDate,
  originDeparture,
  stations,
}: {
  train: Train;
  serviceDate: IsoDate;
  originDeparture: Date;
  stations: Map<string, Station> | null;
}) {
  const { t } = useTranslation();
  const f = useFormat();
  const ids = useId();
  const [version, setVersion] = useState(0);
  const existing = useAsync(() => reminders.get(followReminderId(train.id, serviceDate)).catch(() => undefined), [train.id, serviceDate, version]);
  const saved = existing.status === 'ready' ? existing.data : undefined;

  // Local edits; until the user changes something, show what is saved (or the defaults).
  const [edit, setEdit] = useState<{ delayOn: boolean; delayMin: number; cancel: boolean } | null>(null);
  const current = edit ?? {
    delayOn: saved ? saved.params.followDelayOverMin != null : true,
    delayMin: saved?.params.followDelayOverMin ?? FOLLOW_DELAY_DEFAULT,
    cancel: saved ? Boolean(saved.params.followCancellation) : true,
  };
  const set = (patch: Partial<typeof current>) => {
    setEdit({ ...current, ...patch });
    setStatus(null);
  };
  const [status, setStatus] = useState<null | 'saved' | 'stopped' | 'chooseOne' | 'failed'>(null);
  // Shown straight from the save result (no wait for the stored copy to be read back).
  const [events, setEvents] = useState<{ list: FollowEvent[]; limit: number | null } | null>(null);

  const follow = async () => {
    if (!current.delayOn && !current.cancel) {
      setStatus('chooseOne');
      return;
    }
    const options = { delayOverMin: current.delayOn ? current.delayMin : null, cancellation: current.cancel };
    try {
      const evts = await getFollowEvents(train.id, serviceDate, options);
      await reminders.put(followReminder(train, serviceDate, originDeparture, options, evts));
      announceRemindersChanged();
      setEvents({ list: evts, limit: options.delayOverMin });
      setEdit(null);
      setVersion((v) => v + 1);
      setStatus('saved');
    } catch {
      setStatus('failed');
    }
  };

  const unfollow = async () => {
    try {
      await reminders.remove(followReminderId(train.id, serviceDate));
      announceRemindersChanged();
      setEvents(null);
      setEdit(null);
      setVersion((v) => v + 1);
      setStatus('stopped');
    } catch {
      setStatus('failed');
    }
  };

  const limit = events ? events.limit : (saved?.params.followDelayOverMin ?? null);
  const shownEvents: FollowEvent[] | null =
    events?.list ??
    (saved
      ? saved.alerts.map((a) =>
          a.kind === 'cancelled'
            ? { kind: 'cancelled' as const, at: a.at }
            : { kind: 'delay' as const, at: a.at, delayMin: a.delayMin ?? 0, stationId: a.stationId ?? '' },
        )
      : null);

  return (
    <Card>
      <section aria-labelledby={`${ids}-title`} className="grid gap-3">
        <h2 id={`${ids}-title`} className="flex items-center gap-2 text-lg font-bold">
          <BellIcon className="shrink-0 text-accent" />
          {t('follow.title')}
        </h2>
        <p className="text-sm">{t('follow.intro')}</p>

        <div className="grid gap-2 rounded-xl border border-border p-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={current.delayOn}
              onChange={(e) => set({ delayOn: e.target.checked })}
              className="mt-1 size-5 shrink-0 accent-[var(--accent)]"
            />
            <span>{t('follow.delayToggle')}</span>
          </label>
          <label className="ml-8 flex items-center gap-2">
            <span className="sr-only">{t('follow.delayLabel')}</span>
            <select
              value={current.delayMin}
              disabled={!current.delayOn}
              onChange={(e) => set({ delayMin: Number(e.target.value) })}
              className="tap rounded-xl border border-border bg-surface px-3 py-2 disabled:opacity-50"
              aria-label={t('follow.delayLabel')}
            >
              {FOLLOW_DELAY_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {t('follow.minutes', { count: m })}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-border p-3">
          <input
            type="checkbox"
            checked={current.cancel}
            onChange={(e) => set({ cancel: e.target.checked })}
            className="mt-1 size-5 shrink-0 accent-[var(--accent)]"
          />
          <span>{t('follow.cancelToggle')}</span>
        </label>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void follow()}>{saved ? t('follow.update') : t('follow.save')}</Button>
          {saved && (
            <Button variant="ghost" onClick={() => void unfollow()}>
              {t('follow.stop')}
            </Button>
          )}
        </div>

        <div aria-live="polite" className="grid gap-1">
          {status === 'saved' && (
            <p className="flex items-center gap-2 font-semibold text-ok">
              <CheckIcon className="shrink-0" />
              {t('follow.saved')}
            </p>
          )}
          {status === 'stopped' && <p>{t('follow.stopped')}</p>}
          {status === 'chooseOne' && <Notice tone="warn">{t('follow.chooseOne')}</Notice>}
          {status === 'failed' && <Notice tone="danger">{t('reminders.saveFailed')}</Notice>}
          {shownEvents && (
            <div className="text-sm" data-testid="follow-events">
              {shownEvents.length === 0 ? (
                <p>{t('follow.nothingWouldFire')}</p>
              ) : (
                <>
                  <p className="font-semibold">{t('follow.wouldFire')}</p>
                  <ul className="list-disc pl-6">
                    {shownEvents.map((e) => (
                      <li key={`${e.kind}-${e.at}`}>
                        {e.kind === 'cancelled'
                          ? t('follow.eventCancelled', { time: f.dateTime(e.at) })
                          : t('follow.eventDelay', {
                              time: f.dateTime(e.at),
                              limit,
                              station: f.station(stations?.get(e.stationId)),
                              min: e.delayMin,
                            })}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </Card>
  );
}
