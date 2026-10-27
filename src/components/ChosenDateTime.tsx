import { useTranslation } from 'react-i18next';
import { formatDate } from '@/lib/format';
import { isClockTime, isIsoDate } from '@/lib/time';

/**
 * Echoes a native date/time input back in the app's own words, e.g.
 * "You chose: Wed, 9 Dec 2026, 20:00 (Sri Lanka time)". The browser draws its
 * date box in the phone's locale (12/09 or 09/12?), so this removes the ambiguity.
 * Link inputs to it with aria-describedby={id}.
 */
export function ChosenDateTime({ id, date, time }: { id: string; date?: string; time?: string }) {
  const { t, i18n } = useTranslation();
  const d = date && isIsoDate(date) ? formatDate(date, i18n.language) : null;
  const tm = time && isClockTime(time) ? time : null;
  const value = d && tm ? t('format.chosenDateTime', { date: d, time: tm }) : d ? d : tm ? t('format.chosenTime', { time: tm }) : null;
  return (
    <p id={id} aria-live="polite" className="text-sm font-semibold [overflow-wrap:anywhere]" data-testid={id}>
      {value ? t('format.chosen', { value }) : null}
    </p>
  );
}
