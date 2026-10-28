import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { getStation, getStationBoard } from '@/api';
import { Badge } from '@/components/Badge';
import { buttonClass } from '@/components/buttonClass';
import { ButtonLink } from '@/components/Button';
import { Card } from '@/components/Card';
import { ExternalLink } from '@/components/ExternalLink';
import { Loading } from '@/components/Loading';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { CheckIcon, ChevronRightIcon, CloseIcon, ExternalIcon, MapIcon, PinIcon, SearchIcon } from '@/components/icons';
import { directionsUrl } from '@/config/links';
import { useAsync } from '@/hooks/useAsync';
import { useFormat } from '@/hooks/useFormat';
import { useStations } from '@/hooks/useStations';
import { colomboDateOf } from '@/lib/time';
import { homeUrl, trainUrl } from '@/lib/urls';
import type { Station } from '@/types';

const FLAGS = [
  { key: 'reservationCounter', label: 'stations.reservationCounter' },
  { key: 'mTicketing', label: 'stations.mTicketing' },
  { key: 'praveshaVerification', label: 'stations.praveshaVerification' },
] as const;

export default function StationScreen() {
  const { t } = useTranslation();
  const { stationId = '' } = useParams();
  const data = useAsync(() => getStation(stationId), [stationId]);

  if (data.status === 'loading') {
    return (
      <>
        <PageHeader title={t('screens.station')} back="/stations" />
        <Loading />
      </>
    );
  }
  if (data.status === 'error' || !data.data) {
    return (
      <>
        <PageHeader title={t('screens.station')} back="/stations" />
        <div className="mx-auto max-w-2xl p-4">
          <Notice tone="warn">{data.status === 'error' ? t('common.error') : t('stations.notFound')}</Notice>
        </div>
      </>
    );
  }
  return <StationDetail station={data.data} />;
}

function StationDetail({ station }: { station: Station }) {
  const { t } = useTranslation();
  const f = useFormat();
  const stations = useStations();
  // Fixed for this visit; the board below is "from now".
  const now = useMemo(() => new Date(), []);
  const board = useAsync(() => getStationBoard(station.id, now, 5), [station.id, now]);
  const others = (['en', 'si', 'ta'] as const).filter((l) => l !== f.lng).map((l) => station.name[l]);

  return (
    <>
      <PageHeader title={f.station(station)} back="/stations" sampleData />
      <div className="mx-auto grid max-w-2xl gap-4 p-4">
        <Card>
          <p className="text-muted [overflow-wrap:anywhere]">{others.join(' · ')}</p>
          <p className="text-sm text-muted">{t('stations.code', { code: station.code })}</p>
          <h2 className="mt-3 text-sm font-semibold text-muted">{t('stations.lines')}</h2>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {station.lines.map((l) => (
              <li key={l}>
                <Badge tone="accent">{t(`lines.${l}`)}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <section aria-labelledby="facilities-title" className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="facilities-title" className="text-lg font-bold">
                {t('stations.facilities')}
              </h2>
              <Badge tone="warn">{t('stations.sampleFlags')}</Badge>
            </div>
            <p className="text-sm text-muted">{t('stations.sampleFlagsNote')}</p>
            <dl className="grid gap-1">
              {FLAGS.map(({ key, label }) => {
                const yes = station.facilities[key];
                return (
                  <div key={key} className="flex items-center justify-between gap-2 border-t border-border py-2">
                    <dt className="font-semibold">{t(label)}</dt>
                    <dd className={`flex items-center gap-1 font-semibold ${yes ? 'text-text' : 'text-muted'}`}>
                      {yes ? <CheckIcon className="shrink-0" /> : <CloseIcon className="shrink-0" />}
                      {yes ? t('stations.yes') : t('stations.no')}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        </Card>

        <Card>
          <section aria-labelledby="departures-title" className="grid gap-2">
            <h2 id="departures-title" className="text-lg font-bold">
              {t('stations.departures')}
            </h2>
            {board.status === 'loading' && <Loading />}
            {board.status === 'error' && <Notice tone="danger">{t('common.error')}</Notice>}
            {board.status === 'ready' && board.data.length === 0 && <p>{t('stations.departuresNone')}</p>}
            {board.status === 'ready' && board.data.length > 0 && (
              <ul className="divide-y divide-border">
                {board.data.map((d) => {
                  const date = colomboDateOf(new Date(d.scheduled));
                  return (
                    <li key={`${d.trainId}-${d.scheduled}`}>
                      <Link
                        to={trainUrl(d.trainId, { date, from: station.id, to: d.destinationStationId })}
                        className="tap flex items-center gap-3 py-2 hover:bg-surface-2"
                      >
                        <span className="w-14 shrink-0 text-lg font-bold tabular">{f.time(d.scheduled)}</span>
                        <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                          <span className="block font-semibold">{f.train({ number: d.trainNumber, name: d.trainName })}</span>
                          <span className="block text-sm text-muted">
                            {t('stations.departureTo', { station: f.station(stations?.get(d.destinationStationId)) })}
                          </span>
                        </span>
                        <ChevronRightIcon className="shrink-0 text-muted" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </Card>

        <div className="grid gap-2">
          <ExternalLink href={directionsUrl(station.lat, station.lng)} className={buttonClass('primary', 'lg')}>
            <PinIcon className="shrink-0" />
            <span className="min-w-0">{t('stations.directions')}</span>
            <ExternalIcon className="shrink-0" />
          </ExternalLink>
          <p className="text-center text-sm text-muted">{t('stations.directionsHint')}</p>
          <ButtonLink to={`/stations?view=map&focus=${encodeURIComponent(station.id)}`} variant="secondary" icon={<MapIcon />}>
            {t('stations.showOnMap')}
          </ButtonLink>
          <ButtonLink to={homeUrl({ from: station.id })} variant="secondary" icon={<SearchIcon />}>
            {t('stations.findTrains')}
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
