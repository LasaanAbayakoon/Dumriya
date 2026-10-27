import { useTranslation } from 'react-i18next';
import { buttonClass } from '@/components/buttonClass';
import { Card } from '@/components/Card';
import { ExternalLink } from '@/components/ExternalLink';
import { Notice } from '@/components/Notice';
import { ExternalIcon, ShieldIcon } from '@/components/icons';
import { isOfficialUrl } from '@/config/links';

/**
 * "You are leaving" notice plus the only outbound booking link. The URL must be
 * one of the official hosts in config/links.ts; anything else renders nothing.
 */
export function OfficialHandoff({ url, buttonLabel, title, body }: { url: string; buttonLabel: string; title?: string; body?: string }) {
  const { t } = useTranslation();
  if (!isOfficialUrl(url)) return null;
  const host = new URL(url).host;

  return (
    <Card>
      <section aria-labelledby={`leave-${host}`} className="grid gap-3">
        <h2 id={`leave-${host}`} className="flex items-center gap-2 text-lg font-bold">
          <ShieldIcon className="shrink-0 text-accent" />
          <span className="[overflow-wrap:anywhere]">{title ?? t('book.leaveTitle')}</span>
        </h2>
        <p>{body ?? t('book.leaveBody')}</p>
        <Notice tone="warn">
          <p>{t('book.lookAlike')}</p>
          <p className="mt-1 rounded-md bg-surface px-2 py-1 font-mono text-base font-bold break-all" data-testid="official-host">
            {host}
          </p>
        </Notice>
        <ExternalLink href={url} className={buttonClass('primary', 'lg')}>
          <span className="min-w-0">{buttonLabel}</span>
          <ExternalIcon className="shrink-0" />
        </ExternalLink>
        <p className="text-center text-sm text-muted">{t('book.opensNewTab')}</p>
      </section>
    </Card>
  );
}
