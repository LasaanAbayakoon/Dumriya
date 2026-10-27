import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { AlertIcon, ChevronRightIcon, CoinsIcon, InfoIcon, PinIcon, SettingsIcon } from '@/components/icons';

const items = [
  { to: '/stations', key: 'screens.stations', Icon: PinIcon },
  { to: '/refund', key: 'screens.refund', Icon: CoinsIcon },
  { to: '/dispute', key: 'screens.dispute', Icon: AlertIcon },
  { to: '/settings', key: 'screens.settings', Icon: SettingsIcon },
  { to: '/settings/about', key: 'screens.about', Icon: InfoIcon },
] as const;

export default function MoreScreen() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('screens.more')} />
      <ul className="mx-auto max-w-2xl divide-y divide-border">
        {items.map(({ to, key, Icon }) => (
          <li key={to}>
            <Link to={to} className="tap flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
              <Icon className="shrink-0 text-accent" />
              <span className="min-w-0 flex-1 font-semibold [overflow-wrap:anywhere]">{t(key)}</span>
              <ChevronRightIcon className="shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
