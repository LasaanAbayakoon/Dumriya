import { lazy, Suspense } from 'react';
import { NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useOnline } from '@/hooks/useOnline';
import { BellIcon, MenuIcon, SearchIcon, TicketIcon } from './icons';
import { Loading } from './Loading';

// Loaded after first paint so reminder code stays out of the initial download.
const ReminderScheduler = lazy(() => import('@/features/reminders/ReminderScheduler').then((m) => ({ default: m.ReminderScheduler })));

const tabs = [
  { to: '/', key: 'nav.search', Icon: SearchIcon, match: ['/', '/results', '/train'] },
  { to: '/tickets', key: 'nav.tickets', Icon: TicketIcon, match: ['/tickets'] },
  { to: '/reminders', key: 'nav.reminders', Icon: BellIcon, match: ['/reminders'] },
  { to: '/more', key: 'nav.more', Icon: MenuIcon, match: ['/more', '/settings', '/refund', '/dispute', '/stations'] },
] as const;

function isActive(pathname: string, match: readonly string[]) {
  return match.some((m) => (m === '/' ? pathname === '/' : pathname === m || pathname.startsWith(m + '/')));
}

export function AppShell() {
  const { t } = useTranslation();
  const online = useOnline();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3"
      >
        {t('common.skipToContent')}
      </a>
      {!online && (
        <div role="status" className="bg-warn-soft px-4 py-2 text-center text-sm font-semibold text-warn">
          {t('common.offline')}
        </div>
      )}
      <Suspense fallback={null}>
        <ReminderScheduler />
      </Suspense>
      <main id="main" className="flex-1 pb-28">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
      <nav aria-label={t('nav.main')} className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface">
        <ul className="mx-auto grid max-w-2xl grid-cols-4">
          {tabs.map(({ to, key, Icon, match }) => {
            const active = isActive(pathname, match);
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={`tap flex h-full flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-center text-xs font-semibold leading-tight [overflow-wrap:anywhere] ${
                    active ? 'text-accent' : 'text-muted'
                  }`}
                >
                  <Icon className={active ? 'stroke-[2.5]' : ''} />
                  <span>{t(key)}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <ScrollRestoration />
    </div>
  );
}
