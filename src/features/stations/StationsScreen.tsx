import { lazy, Suspense, useCallback, useId, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { searchStations } from '@/api';
import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { ChevronRightIcon, PinIcon } from '@/components/icons';
import { useAsync } from '@/hooks/useAsync';
import { useFormat } from '@/hooks/useFormat';
import { useOnline } from '@/hooks/useOnline';
import { distanceKm, getCurrentPosition, type Coords, type GeoFailure } from '@/lib/geo';
import type { Station } from '@/types';

// Leaflet (and its CSS) load only when the map view is opened.
const StationMap = lazy(() => import('./StationMap'));

type NearMe = { state: 'off' } | { state: 'locating' } | { state: 'on'; coords: Coords } | { state: 'failed'; reason: GeoFailure };

export default function StationsScreen() {
  const { t } = useTranslation();
  const f = useFormat();
  const online = useOnline();
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'map' ? 'map' : 'list';
  const focusId = params.get('focus');
  const [query, setQuery] = useState('');
  // Location lives only in this state: never in the URL, storage or any request.
  const [near, setNear] = useState<NearMe>({ state: 'off' });
  const searchId = useId();

  const results = useAsync(() => searchStations(query), [query]);
  const found = results.status === 'ready' ? results.data : results.status === 'loading' ? results.stale : undefined;

  const list = useMemo(() => {
    if (!found) return undefined;
    if (near.state !== 'on') return found.map((s) => ({ s, km: null as number | null }));
    return found.map((s) => ({ s, km: distanceKm(near.coords, s) })).sort((a, b) => a.km - b.km);
  }, [found, near]);

  const locate = async () => {
    setNear({ state: 'locating' });
    try {
      setNear({ state: 'on', coords: await getCurrentPosition() });
    } catch (reason) {
      setNear({ state: 'failed', reason: reason as GeoFailure });
    }
  };

  const setView = (v: 'list' | 'map') => {
    const next = new URLSearchParams(params);
    if (v === 'map') next.set('view', 'map');
    else next.delete('view');
    setParams(next, { replace: true });
  };

  const label = useCallback((s: Station) => f.station(s), [f]);
  const openLabel = useCallback((s: Station) => t('stations.openStation', { station: f.station(s) }), [t, f]);
  const mapStations = useMemo(() => (list ?? []).map((x) => x.s), [list]);
  const youAreHere = useMemo(
    () => (near.state === 'on' ? { coords: near.coords, label: t('stations.youAreHere') } : null),
    [near, t],
  );

  const others = (s: Station) => (['en', 'si', 'ta'] as const).filter((l) => l !== f.lng).map((l) => s.name[l]);
  const tab = (v: 'list' | 'map') =>
    `tap flex-1 rounded-lg px-3 py-1 font-semibold ${view === v ? 'bg-accent text-accent-contrast' : 'text-accent hover:bg-accent-soft'}`;

  return (
    <>
      <PageHeader title={t('screens.stations')} back="/more" />
      <div className="mx-auto grid max-w-2xl gap-3 p-4">
        <p>{t('stations.intro')}</p>

        <div>
          <label htmlFor={searchId} className="mb-1 block font-semibold">
            {t('picker.searchLabel')}
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-describedby={`${searchId}-hint`}
            autoComplete="off"
            className="tap w-full rounded-xl border border-border bg-surface px-3 py-2 text-lg"
          />
          <p id={`${searchId}-hint`} className="mt-1 text-sm text-muted">
            {t('picker.searchHint')}
          </p>
        </div>

        <div className="grid gap-1">
          {near.state === 'on' ? (
            <Button variant="secondary" onClick={() => setNear({ state: 'off' })}>
              {t('stations.stopNearMe')}
            </Button>
          ) : (
            <Button variant="secondary" icon={<PinIcon />} onClick={() => void locate()} disabled={near.state === 'locating'}>
              {near.state === 'locating' ? t('stations.locating') : t('stations.nearMe')}
            </Button>
          )}
          <p className="text-sm text-muted">{t('stations.nearMeHint')}</p>
          <div aria-live="polite">
            {near.state === 'on' && <p className="text-sm font-semibold">{t('stations.nearMeOn')}</p>}
            {near.state === 'failed' && (
              <Notice tone="warn">
                {near.reason === 'denied'
                  ? t('stations.geoDenied')
                  : near.reason === 'unsupported'
                    ? t('stations.geoUnsupported')
                    : t('stations.geoUnavailable')}
              </Notice>
            )}
          </div>
        </div>

        <div role="group" aria-label={t('stations.viewLabel')} className="flex gap-1 rounded-xl border border-border bg-surface p-1">
          <button type="button" aria-pressed={view === 'list'} className={tab('list')} onClick={() => setView('list')}>
            {t('stations.list')}
          </button>
          <button type="button" aria-pressed={view === 'map'} className={tab('map')} onClick={() => setView('map')}>
            {t('stations.map')}
          </button>
        </div>

        {list && <p className="text-sm text-muted" aria-live="polite">{t('stations.count', { count: list.length })}</p>}
        {list && list.length === 0 && <Notice>{t('picker.noResults', { query })}</Notice>}

        {view === 'map' && (
          <>
            {!online && <Notice tone="warn">{t('stations.mapOffline')}</Notice>}
            <Suspense fallback={<Loading />}>
              <StationMap
                stations={mapStations}
                label={label}
                openLabel={openLabel}
                ariaLabel={t('stations.mapLabel')}
                youAreHere={youAreHere}
                focusId={focusId}
              />
            </Suspense>
          </>
        )}

        {view === 'list' && !list && <Loading />}
        {view === 'list' && list && list.length > 0 && (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {list.map(({ s, km }) => (
              <li key={s.id}>
                <Link to={`/stations/${encodeURIComponent(s.id)}`} className="tap flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold [overflow-wrap:anywhere]">{f.station(s)}</span>
                    <span className="block text-sm text-muted [overflow-wrap:anywhere]">{others(s).join(' · ')}</span>
                    <span className="mt-1 flex flex-wrap gap-1 text-xs">
                      {s.lines.map((l) => (
                        <span key={l} className="rounded-md border border-border px-1.5 py-0.5 text-muted">
                          {t(`lines.${l}`)}
                        </span>
                      ))}
                      {km !== null && <span className="rounded-md bg-accent-soft px-1.5 py-0.5 font-semibold text-accent">{t('stations.kmAway', { km: km.toFixed(1) })}</span>}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-md bg-surface-2 px-2 py-0.5 text-sm font-semibold text-muted">{s.code}</span>
                  <ChevronRightIcon className="shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
