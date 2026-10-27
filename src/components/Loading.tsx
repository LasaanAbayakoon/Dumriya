import { useTranslation } from 'react-i18next';

export function Loading({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 p-8 text-muted">
      <span className="size-5 animate-spin rounded-full border-2 border-border border-t-accent" aria-hidden="true" />
      <span>{label ?? t('common.loading')}</span>
    </div>
  );
}
