import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatNumber, formatShortDate, formatTime, stationName, trainLabel } from '@/lib/format';
import type { IsoDate, Station, Train } from '@/types';

/** Formatters bound to the current language. */
export function useFormat() {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  return useMemo(
    () => ({
      lng,
      date: (d: IsoDate | Date | string) => formatDate(d, lng),
      shortDate: (d: IsoDate | Date | string) => formatShortDate(d, lng),
      time: (d: Date | string) => formatTime(d, lng),
      lkr: (n: number) => t('format.lkr', { amount: formatNumber(n, lng) }),
      duration: (min: number) =>
        min < 60
          ? t('format.durationM', { m: min })
          : min % 60 === 0
            ? t('format.durationH', { h: min / 60 })
            : t('format.durationHm', { h: Math.floor(min / 60), m: min % 60 }),
      station: (s: Station | undefined | null) => stationName(s, lng),
      train: (tr: Pick<Train, 'number' | 'name'>) => trainLabel(tr, lng),
    }),
    [lng, t],
  );
}
