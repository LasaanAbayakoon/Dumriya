import { useTranslation } from 'react-i18next';
import { formatWeekday } from '@/lib/format';
import type { Weekday } from '@/types';

// Monday first, as on printed timetables.
const WEEK: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export function RunningDays({ days }: { days: Weekday[] }) {
  const { t, i18n } = useTranslation();
  const runs = (d: Weekday) => days.includes(d);
  const daily = WEEK.every(runs);
  return (
    <div>
      <p className="mb-2">
        {daily
          ? t('train.runsDaily')
          : t('train.runsOn', { days: WEEK.filter(runs).map((d) => formatWeekday(d, i18n.language, 'long')).join(', ') })}
      </p>
      <ul className="flex flex-wrap gap-1.5" aria-hidden="true">
        {WEEK.map((d) => (
          <li
            key={d}
            className={`min-w-11 rounded-lg border px-2 py-1 text-center text-sm font-semibold ${
              runs(d) ? 'border-accent bg-accent-soft text-accent' : 'border-border text-muted line-through'
            }`}
          >
            {formatWeekday(d, i18n.language)}
          </li>
        ))}
      </ul>
    </div>
  );
}
