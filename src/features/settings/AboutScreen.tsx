import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import licenses from 'virtual:dumriya-licenses';
import { IS_SAMPLE_DATA } from '@/api';
import { Card } from '@/components/Card';
import { ExternalLink } from '@/components/ExternalLink';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { CheckIcon, ChevronRightIcon, CloseIcon, ExternalIcon, ShieldIcon } from '@/components/icons';
import { FEEDBACK_URL } from '@/config/app';
import { OFFICIAL_RESERVATION_URL, PRAVESHA_URL } from '@/config/links';
import { POLICY_INFO_AS_OF } from '@/config/policy';
import { useFormat } from '@/hooks/useFormat';

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Card>
      <section aria-labelledby={id} className="grid gap-2">
        <h2 id={id} className="text-lg font-bold">
          {title}
        </h2>
        {children}
      </section>
    </Card>
  );
}

const linkClass = 'tap inline-flex items-center gap-1 font-semibold text-accent underline [overflow-wrap:anywhere]';

export default function AboutScreen() {
  const { t } = useTranslation();
  const f = useFormat();

  return (
    <>
      <PageHeader title={t('screens.about')} back="/settings" />
      <div className="mx-auto grid max-w-2xl gap-4 p-4">
        <Section id="about-unofficial" title={t('about.unofficialTitle')}>
          <p className="flex items-start gap-2 text-lg font-semibold">
            <ShieldIcon className="mt-1 shrink-0 text-accent" />
            <span>{t('about.unofficial')}</span>
          </p>
          <p>{t('about.officialOnly')}</p>
          <ul className="grid gap-1">
            <li>
              <ExternalLink href={OFFICIAL_RESERVATION_URL} className={linkClass}>
                {t('about.officialReservation')}
                <ExternalIcon className="shrink-0" />
              </ExternalLink>
            </li>
            {PRAVESHA_URL && (
              <li>
                <ExternalLink href={PRAVESHA_URL} className={linkClass}>
                  {t('about.officialPravesha')}
                  <ExternalIcon className="shrink-0" />
                </ExternalLink>
              </li>
            )}
          </ul>
        </Section>

        {IS_SAMPLE_DATA && (
          <Notice tone="warn" title={t('about.sampleTitle')}>
            <span data-testid="about-sample">{t('about.sample')}</span>
          </Notice>
        )}

        <Section id="about-privacy" title={t('about.privacyTitle')}>
          <h3 className="font-semibold">{t('about.storedTitle')}</h3>
          <ul className="grid gap-1">
            {(['about.storedTickets', 'about.storedReminders', 'about.storedSettings'] as const).map((k) => (
              <li key={k} className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 shrink-0 text-accent" />
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-2 font-semibold">{t('about.neverTitle')}</h3>
          <ul className="grid gap-1">
            {(['about.neverDispute', 'about.neverLocation'] as const).map((k) => (
              <li key={k} className="flex items-start gap-2">
                <CloseIcon className="mt-0.5 shrink-0 text-muted" />
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 font-semibold">{t('about.noServer')}</p>
          <p className="text-sm">{t('about.contacts')}</p>
          <p>{t('about.deleteHow')}</p>
          <Link to="/settings" className={linkClass}>
            {t('about.openSettings')}
            <ChevronRightIcon className="shrink-0" />
          </Link>
        </Section>

        <Section id="about-credits" title={t('about.creditsTitle')}>
          <p>{t('about.osm')}</p>
          <ExternalLink href="https://www.openstreetmap.org/copyright" className={linkClass}>
            {t('about.osmLink')}
            <ExternalIcon className="shrink-0" />
          </ExternalLink>
          <p>{t('about.timetableSource')}</p>
        </Section>

        <Section id="about-rules" title={t('about.rulesTitle')}>
          <p>{t('about.rules', { date: f.date(POLICY_INFO_AS_OF) })}</p>
        </Section>

        <Section id="about-licences" title={t('about.licensesTitle')}>
          <p>{t('about.licensesIntro')}</p>
          <ul className="divide-y divide-border text-sm" data-testid="licences">
            {licenses.map((l) => (
              <li key={`${l.name}@${l.version}`} className="flex flex-wrap justify-between gap-x-3 py-1.5">
                <span className="min-w-0 font-semibold break-all">
                  {l.name} <span className="font-normal text-muted">{l.version}</span>
                </span>
                <span className="tabular">{l.license}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm">{t('about.fonts')}</p>
        </Section>

        <Section id="about-version" title={t('about.versionTitle')}>
          <p data-testid="app-version">{t('about.version', { version: __APP_VERSION__, date: f.dateTime(__BUILD_DATE__) })}</p>
          <h3 className="mt-2 font-semibold">{t('about.feedbackTitle')}</h3>
          {FEEDBACK_URL ? (
            <ExternalLink href={FEEDBACK_URL} className={linkClass}>
              {t('about.feedback')}
              <ExternalIcon className="shrink-0" />
            </ExternalLink>
          ) : (
            <p className="text-muted">{t('about.feedbackSoon')}</p>
          )}
        </Section>
      </div>
    </>
  );
}
