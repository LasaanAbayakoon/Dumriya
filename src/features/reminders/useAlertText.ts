import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@/hooks/useFormat';
import type { AlertText } from '@/lib/reminders';

/** Notification / calendar text for an alert, in the current language. */
export function useAlertText(): AlertText {
  const { t } = useTranslation();
  const f = useFormat();
  return useCallback<AlertText>(
    (reminder, alert) => {
      const p = reminder.params;
      const train = p.trainNumber ? f.train({ number: p.trainNumber, name: p.trainName ?? null }) : '';
      const date = p.travelDate ? f.date(p.travelDate) : '';
      const key =
        alert.kind === 'heads-up' ? 'reminder.headsUpText' : alert.kind === 'midnight' ? 'reminder.midnightText' : 'reminder.openingText';
      return { title: t(key, { train, date }) };
    },
    [t, f],
  );
}
