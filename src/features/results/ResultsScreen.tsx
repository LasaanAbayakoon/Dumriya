import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { searchTrains } from '@/api';
import { Button, ButtonLink } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { BackIcon, ChevronRightIcon } from '@/components/icons';
import { useAsync } from '@/hooks/useAsync';
import { useFormat } from '@/hooks/useFormat';
import { useStations } from '@/hooks/useStations';
import { addDays, isClockTime, isIsoDate, todayInColombo } from '@/lib/time';
import { homeUrl, resultsUrl } from '@/lib/urls';
import type { Station } from '@/types';
import { TrainCard } from './TrainCard';

/**
 * When two stations share no line, returns them plus a station on both lines where people
 * could change (e.g. Colombo Fort for Coastal ↔ Main). Null when they share a line.
 */
function differentLines(stations: Map<string, Station>, fromId: string, toId: string) {
  const from = stations.get(fromId);
  const to = stations.get(toId);
  if (!from || !to || from.lines.some((l) => to.lines.includes(l))) return null;
  const via = [...stations.values()].find(
    (s) => s.id !== fromId && s.id !== toId && s.lines.some((l) => from.lines.includes(l)) && s.lines.some((l) => to.lines.includes(l)),
  );
  return { from, to, via };
}

export default function ResultsScreen() {
  const { t } = useTranslation();
  const f = useFormat();
  const [params] = useSearchParams();
  const stations = useStations();
  const today = useMemo(() => todayInColombo(), []);

  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const date = params.get('date') ?? '';
  const rawTime = params.get('time');
  const time = rawTime && isClockTime(rawTime) ? rawTime : undefined;
  const valid = Boolean(from && to && from !== to && isIsoDate(date));

  const trips = useAsync(
    () => (valid ? searchTrains({ fromStationId: from, toStationId: to, date, time }) : Promise.resolve([])),
    [from, to, date, time, valid],
  );

  // Stations on different lines: no direct train on any day, so "try another date" would mislead.
  const noDirect = valid && stations ? differentLines(stations, from, to) : null;

  const title = valid
    ? t('results.route', { from: f.station(stations?.get(from)), to: f.station(stations?.get(to)) })
    : t('screens.results');
  const query = { from, to, time };

  if (!valid) {
    return (
      <>
        <PageHeader title={title} back="/" sampleData />
        <div className="mx-auto grid max-w-2xl gap-4 p-4">
          <Notice>{t('results.missing')}</Notice>
          <ButtonLink to={homeUrl(query)}>{t('results.changeSearch')}</ButtonLink>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={title} back={homeUrl({ ...query, date })} sampleData />
      <div className="mx-auto grid max-w-2xl gap-3 p-4">
        <nav aria-label={t('home.date')} className="flex items-center gap-2">
          {date > today ? (
            <ButtonLink to={resultsUrl({ ...query, date: addDays(date, -1) })} variant="secondary" aria-label={t('results.prevDay')}>
              <BackIcon />
            </ButtonLink>
          ) : (
            <Button variant="secondary" disabled aria-label={t('results.prevDay')}>
              <BackIcon />
            </Button>
          )}
          <p className="min-w-0 flex-1 text-center font-semibold [overflow-wrap:anywhere]" aria-live="polite">
            {f.date(date)}
          </p>
          <ButtonLink to={resultsUrl({ ...query, date: addDays(date, 1) })} variant="secondary" aria-label={t('results.nextDay')}>
            <ChevronRightIcon />
          </ButtonLink>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
          <span>
            {trips.status === 'ready' && t('results.count', { count: trips.data.length })}
            {time && <> · {t('results.leavingAfter', { time })}</>}
          </span>
          <Link to={homeUrl({ ...query, date })} className="tap inline-flex max-w-full items-center font-semibold text-accent underline [overflow-wrap:anywhere]">
            {t('results.changeSearch')}
          </Link>
        </div>

        {trips.status === 'loading' && <Loading />}
        {trips.status === 'error' && (
          <Notice tone="danger">
            <p>{t('common.error')}</p>
            <Button variant="secondary" className="mt-2" onClick={trips.reload}>
              {t('common.retry')}
            </Button>
          </Notice>
        )}
        {trips.status === 'ready' && trips.data.length === 0 && noDirect && (
          <div className="grid gap-3">
            <Notice title={t('results.noDirectTitle')}>
              {noDirect.via
                ? t('results.noDirect', { from: f.station(noDirect.from), to: f.station(noDirect.to), via: f.station(noDirect.via) })
                : t('results.noDirectPlain', { from: f.station(noDirect.from), to: f.station(noDirect.to) })}
            </Notice>
            {noDirect.via && (
              <>
                <ButtonLink to={resultsUrl({ from, to: noDirect.via.id, date, time })} variant="secondary">
                  {t('results.searchLeg', { from: f.station(noDirect.from), to: f.station(noDirect.via) })}
                </ButtonLink>
                <ButtonLink to={resultsUrl({ from: noDirect.via.id, to, date })} variant="secondary">
                  {t('results.searchLeg', { from: f.station(noDirect.via), to: f.station(noDirect.to) })}
                </ButtonLink>
              </>
            )}
          </div>
        )}
        {trips.status === 'ready' && trips.data.length === 0 && !noDirect && (
          <div className="grid gap-3">
            <Notice>
              <p className="font-semibold">{time ? t('results.noneAfter', { time }) : t('results.none')}</p>
              <p>{t('results.noneHint')}</p>
            </Notice>
            {time && (
              <ButtonLink to={resultsUrl({ from, to, date })} variant="secondary">
                {t('results.showAllDay')}
              </ButtonLink>
            )}
          </div>
        )}
        {trips.status === 'ready' && trips.data.length > 0 && (
          <ul className="grid gap-3">
            {trips.data.map((trip) => (
              <li key={trip.train.id}>
                <TrainCard trip={trip} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
