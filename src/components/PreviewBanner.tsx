import { useTranslation } from 'react-i18next';
import { InfoIcon } from './icons';

/**
 * "Preview — simulated, not real train positions". Shown on every preview screen, separate
 * from (and styled differently to) the sample-data banner, and independent of the API: even
 * with real timetables, live positions stay simulated until a live feed exists.
 */
export function PreviewBanner() {
  const { t } = useTranslation();
  return (
    <p
      data-testid="preview-banner"
      className="flex items-center justify-center gap-2 border-t border-accent/40 bg-accent-soft px-3 py-1 text-center text-sm font-semibold text-accent"
    >
      <InfoIcon className="shrink-0" width="1.1em" height="1.1em" />
      <span className="[overflow-wrap:anywhere]">{t('preview.banner')}</span>
    </p>
  );
}
