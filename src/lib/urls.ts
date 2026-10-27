import type { ClockTime, IsoDate } from '@/types';

const qs = (params: Record<string, string | undefined | null>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : '';
};

export interface SearchQuery {
  from?: string;
  to?: string;
  date?: IsoDate;
  time?: ClockTime;
}

export const homeUrl = (q: SearchQuery = {}) => `/${qs({ ...q })}`;
export const resultsUrl = (q: SearchQuery) => `/results${qs({ ...q })}`;
export const trainUrl = (trainId: string, q: { date: IsoDate; from?: string; to?: string }) =>
  `/train/${encodeURIComponent(trainId)}${qs(q)}`;
export const bookUrl = (trainId: string, q: { date: IsoDate; from?: string; to?: string }) =>
  `/train/${encodeURIComponent(trainId)}/book${qs(q)}`;
export const liveUrl = (trainId: string, q: { date: IsoDate }) => `/train/${encodeURIComponent(trainId)}/live${qs(q)}`;

export interface RefundQuery {
  /** Departure the deadlines count from, ISO with +05:30. */
  departure?: string;
  fare?: number;
  serviceCharge?: number;
  trainId?: string;
  date?: IsoDate;
  from?: string;
  to?: string;
}

export const refundUrl = (q: RefundQuery = {}) =>
  `/refund${qs({
    departure: q.departure,
    fare: q.fare === undefined ? undefined : String(q.fare),
    sc: q.serviceCharge === undefined ? undefined : String(q.serviceCharge),
    train: q.trainId,
    date: q.date,
    from: q.from,
    to: q.to,
  })}`;
