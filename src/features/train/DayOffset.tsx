import { useTranslation } from 'react-i18next';

/** "+1 day" marker for times on a later calendar date; spelled out for screen readers. */
export function DayOffset({ days }: { days: number }) {
  const { t } = useTranslation();
  if (days <= 0) return null;
  return (
    <span className="ml-1 align-super text-xs font-semibold text-muted">
      <span aria-hidden="true">{t('format.plusDay', { count: days })}</span>
      <span className="sr-only">({t('format.nextDay')})</span>
    </span>
  );
}
