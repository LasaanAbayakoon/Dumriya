import { useTranslation } from 'react-i18next';
import type { TrainStatus } from '@/types';
import { Badge, type Tone } from './Badge';

/** Status colours are used ONLY here, for their meaning: on time, delayed, cancelled. */
const TONE: Record<TrainStatus, Tone> = {
  'on-time': 'ok',
  delayed: 'warn',
  cancelled: 'danger',
  'not-started': 'neutral',
  arrived: 'neutral',
};

export function StatusBadge({ status, delayMin }: { status: TrainStatus; delayMin: number }) {
  const { t } = useTranslation();
  const text =
    status === 'on-time'
      ? t('live.statusOnTime')
      : status === 'delayed'
        ? t('live.statusDelayed', { min: delayMin })
        : status === 'cancelled'
          ? t('live.statusCancelled')
          : status === 'not-started'
            ? t('live.statusNotStarted')
            : t('live.statusArrived');
  return (
    <Badge tone={TONE[status]} className="text-base">
      {text}
    </Badge>
  );
}
