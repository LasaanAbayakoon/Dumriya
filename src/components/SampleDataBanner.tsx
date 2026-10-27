import { useTranslation } from 'react-i18next';
import { IS_SAMPLE_DATA } from '@/api';
import { AlertIcon } from './icons';

/**
 * Permanent, non-dismissible bar shown on every screen with train data while the
 * mock API is active. Driven by IS_SAMPLE_DATA, so it disappears with the real API.
 */
export function SampleDataBanner() {
  const { t } = useTranslation();
  if (!IS_SAMPLE_DATA) return null;
  return (
    <p
      data-testid="sample-data-banner"
      className="flex items-center justify-center gap-2 border-t border-warn/40 bg-warn-soft px-3 py-1 text-center text-sm font-semibold text-warn"
    >
      <AlertIcon className="shrink-0" width="1.1em" height="1.1em" />
      <span className="[overflow-wrap:anywhere]">{t('common.sampleBanner')}</span>
    </p>
  );
}
