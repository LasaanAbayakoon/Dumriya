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
      /** e.g. "10:30 on Tue, 10 Nov 2026" (order per language). */
      dateTime: (d: Date | string) => t('format.dateTime', { time: formatTime(d, lng), date: formatDate(d, lng) }),
      /** Live countdown: days/hours/minutes, or hours/minutes/seconds under a day. */
      countdown: (ms: number) => {
        const s = Math.max(0, Math.floor(ms / 1000));
        const d = Math.floor(s / 86_400);
        const h = Math.floor((s % 86_400) / 3600);
        const m = Math.floor((s % 3600) / 60);
        return d > 0
          ? t('format.countdownDhm', { d, h, m })
          : t('format.countdownHms', { h, m: String(m).padStart(2, '0'), s: String(s % 60).padStart(2, '0') });
      },
      station: (s: Station | undefined | null) => stationName(s, lng),
      train: (tr: Pick<Train, 'number' | 'name'>) => trainLabel(tr, lng),
    }),
    [lng, t],
  );
}
