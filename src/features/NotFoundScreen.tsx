import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { ButtonLink } from '@/components/Button';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('common.notFound')} back />
      <div className="mx-auto max-w-2xl p-4">
        <ButtonLink to="/">{t('common.goHome')}</ButtonLink>
      </div>
    </>
  );
}
