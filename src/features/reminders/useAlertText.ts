import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@/hooks/useFormat';
import { useStations } from '@/hooks/useStations';
import type { AlertText } from '@/lib/reminders';

/** Notification / calendar text for an alert, in the current language. */
export function useAlertText(): AlertText {
  const { t } = useTranslation();
  const f = useFormat();
  const stations = useStations();
  return useCallback<AlertText>(
    (reminder, alert) => {
      const p = reminder.params;
      const date = p.travelDate ? f.date(p.travelDate) : '';
      if (reminder.kind === 'warrant-expiry') {
        const when = f.dateTime(alert.deadline ?? reminder.eventAt);
        return {
          title: p.trainNumber
            ? t('reminders.warrantTextTrain', { number: p.trainNumber, when })
            : t('reminders.warrantText', { when }),
        };
      }
      if (reminder.kind === 'train-follow') {
        const train = p.trainNumber ? f.train({ number: p.trainNumber, name: p.trainName ?? null }) : '';
        return alert.kind === 'cancelled'
          ? { title: t('follow.cancelledText', { train, date }) }
          : { title: t('follow.delayText', { train, min: alert.delayMin, station: f.station(stations?.get(alert.stationId ?? '')) }) };
      }
      if (reminder.kind === 'refund-deadline') {
        return {
          title: t('reminders.refundText', {
            number: p.trainNumber ?? '',
            date,
            from: alert.dropsFrom,
            to: alert.dropsTo,
            when: f.dateTime(alert.deadline ?? reminder.eventAt),
          }),
        };
      }
      const train = p.trainNumber ? f.train({ number: p.trainNumber, name: p.trainName ?? null }) : '';
      const key =
        alert.kind === 'heads-up' ? 'reminder.headsUpText' : alert.kind === 'midnight' ? 'reminder.midnightText' : 'reminder.openingText';
      return { title: t(key, { train, date }) };
    },
    [t, f, stations],
  );
}
