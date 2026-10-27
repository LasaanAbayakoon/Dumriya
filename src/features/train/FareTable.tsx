import { useTranslation } from 'react-i18next';
import { CONVENIENCE_FEE_RATE } from '@/config/policy';
import { useFormat } from '@/hooks/useFormat';
import type { Fare } from '@/types';

export function FareTable({ fares, fromName, toName }: { fares: Fare[]; fromName: string; toName: string }) {
  const { t } = useTranslation();
  const f = useFormat();
  return (
    <div>
      <table className="w-full border-collapse">
        <caption className="mb-2 text-left text-sm text-muted">{t('train.faresFor', { from: fromName, to: toName })}</caption>
        <tbody>
          {fares.map((fare) => (
            <tr key={fare.travelClass} className="border-t border-border">
              <th scope="row" className="py-2 pr-2 text-left font-semibold [overflow-wrap:anywhere]">
                {t(`classes.${fare.travelClass}`)}
                <span className="block text-sm font-normal text-muted">
                  {fare.reservable ? t('train.reservable') : t('train.unreserved')}
                </span>
              </th>
              <td className="py-2 text-right text-lg font-bold tabular whitespace-nowrap">{f.lkr(fare.amountLkr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-sm text-muted">{t('train.feeNote', { percent: CONVENIENCE_FEE_RATE * 100 })}</p>
    </div>
  );
}
