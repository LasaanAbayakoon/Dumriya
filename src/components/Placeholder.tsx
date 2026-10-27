import { useTranslation } from 'react-i18next';
import { PageHeader } from './PageHeader';

/** Temporary screen used until a route's real screen is built. */
export function Placeholder({ title, back = true }: { title: string; back?: boolean }) {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={title} back={back} />
      <p className="mx-auto max-w-2xl p-4 text-muted">{t('common.comingSoon')}</p>
    </>
  );
}
