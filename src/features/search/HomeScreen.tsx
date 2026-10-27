import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { StationPicker } from '@/components/StationPicker';
import { BellIcon, ChevronRightIcon, CoinsIcon, SearchIcon, SwapIcon, TicketIcon } from '@/components/icons';
import { useFormat } from '@/hooks/useFormat';
import { useStations } from '@/hooks/useStations';
import { addRecentSearch, clearRecentSearches, getRecentSearches, type RecentSearch } from '@/lib/recentSearches';
import { isClockTime, isIsoDate, todayInColombo } from '@/lib/time';
import { resultsUrl } from '@/lib/urls';
import type { Station } from '@/types';

type Errors = Partial<Record<'from' | 'to' | 'date', string>>;

export default function HomeScreen() {
  const { t } = useTranslation();
  const f = useFormat();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const stations = useStations();
  const today = useMemo(() => todayInColombo(), []);

  // Prefill from the URL when coming back via "Change search".
  const [fromId, setFromId] = useState<string | null>(params.get('from'));
  const [toId, setToId] = useState<string | null>(params.get('to'));
  const [date, setDate] = useState(() => {
    const d = params.get('date');
    return d && isIsoDate(d) && d >= today ? d : today;
  });
  const [time, setTime] = useState(() => {
    const tm = params.get('time');
    return tm && isClockTime(tm) ? tm : '';
  });
  const [errors, setErrors] = useState<Errors>({});
  const [recent, setRecent] = useState<RecentSearch[]>(getRecentSearches);

  const from = (fromId && stations?.get(fromId)) || null;
  const to = (toId && stations?.get(toId)) || null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!fromId) next.from = t('home.errorFrom');
    if (!toId) next.to = t('home.errorTo');
    if (fromId && toId && fromId === toId) next.to = t('home.errorSame');
    if (!isIsoDate(date)) next.date = t('home.errorDate');
    setErrors(next);
    const firstInvalid = (['from', 'to', 'date'] as const).find((k) => next[k]);
    if (firstInvalid) {
      document.getElementById(`search-${firstInvalid}`)?.focus();
      return;
    }
    setRecent(addRecentSearch({ fromStationId: fromId!, toStationId: toId! }));
    void navigate(resultsUrl({ from: fromId!, to: toId!, date, time: time || undefined }));
  };

  const pick = (which: 'from' | 'to') => (s: Station) => {
    (which === 'from' ? setFromId : setToId)(s.id);
    setErrors((e) => ({ ...e, [which]: undefined }));
  };

  const swap = () => {
    setFromId(toId);
    setToId(fromId);
  };

  return (
    <>
      <PageHeader title={t('screens.home')} badge={<Badge>{t('app.unofficial')}</Badge>} />
      <div className="mx-auto grid max-w-2xl gap-4 p-4">
        <Card>
          <form noValidate onSubmit={submit} className="grid gap-3">
            <StationPicker
              id="search-from"
              label={t('home.from')}
              dialogTitle={t('picker.fromTitle')}
              value={from}
              onChange={pick('from')}
              error={errors.from}
            />
            <div className="-my-1 flex justify-end">
              <Button variant="ghost" onClick={swap} icon={<SwapIcon />} className="text-sm">
                {t('home.swap')}
              </Button>
            </div>
            <StationPicker
              id="search-to"
              label={t('home.to')}
              dialogTitle={t('picker.toTitle')}
              value={to}
              onChange={pick('to')}
              error={errors.to}
            />
            <div className="grid gap-3 min-[400px]:grid-cols-2">
              <div>
                <label htmlFor="search-date" className="mb-1 block text-sm font-semibold text-muted">
                  {t('home.date')}
                </label>
                <input
                  id="search-date"
                  type="date"
                  required
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-invalid={errors.date ? true : undefined}
                  aria-describedby={errors.date ? 'search-date-error' : undefined}
                  className="tap w-full rounded-xl border border-border bg-surface px-3 py-2 text-lg"
                />
                {errors.date && (
                  <p id="search-date-error" className="mt-1 text-sm font-semibold text-danger">
                    {errors.date}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="search-time" className="mb-1 block text-sm font-semibold text-muted">
                  {t('home.time')}
                </label>
                <input
                  id="search-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  aria-describedby="search-time-hint"
                  className="tap w-full rounded-xl border border-border bg-surface px-3 py-2 text-lg"
                />
                <p id="search-time-hint" className="mt-1 text-sm text-muted">
                  {t('home.timeHint')}
                </p>
              </div>
            </div>
            <Button type="submit" size="lg" icon={<SearchIcon />}>
              {t('home.search')}
            </Button>
          </form>
        </Card>

        {recent.length > 0 && (
          <section aria-labelledby="recent-heading">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 id="recent-heading" className="text-lg font-bold">
                {t('home.recent')}
              </h2>
              <Button
                variant="ghost"
                className="text-sm"
                onClick={() => {
                  clearRecentSearches();
                  setRecent([]);
                }}
              >
                {t('home.clearRecent')}
              </Button>
            </div>
            <ul className="grid gap-2">
              {recent.map((r) => (
                <li key={`${r.fromStationId}-${r.toStationId}`}>
                  <Link
                    to={resultsUrl({ from: r.fromStationId, to: r.toStationId, date, time: time || undefined })}
                    className="tap flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 hover:bg-surface-2"
                  >
                    <span className="min-w-0 flex-1 font-semibold [overflow-wrap:anywhere]">
                      {t('results.route', {
                        from: f.station(stations?.get(r.fromStationId)),
                        to: f.station(stations?.get(r.toStationId)),
                      })}
                    </span>
                    <ChevronRightIcon className="shrink-0 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="tools-heading">
          <h2 id="tools-heading" className="mb-2 text-lg font-bold">
            {t('home.tools')}
          </h2>
          <ul className="grid gap-2 sm:grid-cols-3">
            {(
              [
                { to: '/tickets', Icon: TicketIcon, title: 'home.toolTickets', hint: 'home.toolTicketsHint' },
                { to: '/refund', Icon: CoinsIcon, title: 'home.toolRefund', hint: 'home.toolRefundHint' },
                { to: '/reminders', Icon: BellIcon, title: 'home.toolReminders', hint: 'home.toolRemindersHint' },
              ] as const
            ).map(({ to: href, Icon, title, hint }) => (
              <li key={href}>
                <Link
                  to={href}
                  className="tap flex h-full items-start gap-3 rounded-xl border border-border bg-surface p-3 hover:bg-surface-2"
                >
                  <Icon className="mt-0.5 shrink-0 text-accent" />
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    <span className="block font-semibold">{t(title)}</span>
                    <span className="block text-sm text-muted">{t(hint)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-sm text-muted">{t('home.unofficialNote')}</p>
      </div>
    </>
  );
}
