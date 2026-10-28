import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { getTrain, getTrip } from '@/api';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChosenDateTime } from '@/components/ChosenDateTime';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { StationPicker } from '@/components/StationPicker';
import { CONVENIENCE_FEE_RATE } from '@/config/policy';
import { MAX_TICKET_FILE_BYTES } from '@/config/app';
import { useAsync } from '@/hooks/useAsync';
import { useFormat } from '@/hooks/useFormat';
import { useStations } from '@/hooks/useStations';
import { moneyInput, prefillMoney } from '@/lib/format';
import { defaultServiceCharge } from '@/lib/refund';
import { newId } from '@/lib/id';
import { requestPersistence, StorageError, tickets } from '@/lib/storage';
import { buildTicket, checkTicketFile, formatBytes, TICKET_FILE_ACCEPT, type TicketFileError } from '@/lib/tickets';
import { isClockTime, isIsoDate } from '@/lib/time';

type Field = 'file' | 'train' | 'from' | 'to' | 'date' | 'time' | 'fare' | 'sc';
const ORDER: Field[] = ['file', 'train', 'from', 'to', 'date', 'time', 'fare', 'sc'];

const amount = (s: string): number | null => {
  const n = Number(s.replace(/,/g, '').trim());
  return s.trim() !== '' && Number.isFinite(n) ? n : null;
};

export default function TicketNewScreen() {
  const { t } = useTranslation();
  const f = useFormat();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const stations = useStations();

  // Prefilled when opened from a train ("Already booked? Save your e-ticket"); the user confirms.
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<TicketFileError | null>(null);
  const [trainNumber, setTrainNumber] = useState(params.get('train') ?? '');
  const [fromId, setFromId] = useState<string | null>(params.get('from'));
  const [toId, setToId] = useState<string | null>(params.get('to'));
  const [date, setDate] = useState(params.get('date') ?? '');
  const [time, setTime] = useState(params.get('time') ?? '');
  const [coach, setCoach] = useState('');
  const [seat, setSeat] = useState('');
  const [reference, setReference] = useState('');
  const [fare, setFare] = useState(() => prefillMoney(params.get('fare')));
  const [sc, setSc] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<StorageError['reason'] | null>(null);

  const fareN = amount(fare);
  const scText = sc ?? (fareN !== null && fareN > 0 ? moneyInput(defaultServiceCharge(fareN)) : '');
  const scN = amount(scText);
  const trimmedTrain = trainNumber.trim();
  const known = useAsync(() => (trimmedTrain ? getTrain(trimmedTrain) : Promise.resolve(null)), [trimmedTrain]);

  const errors: Partial<Record<Field, string>> = {};
  if (attempted) {
    const req = t('tickets.errorRequired');
    if (!file) errors.file = t('tickets.errorFile');
    if (!trimmedTrain) errors.train = req;
    if (!fromId) errors.from = t('home.errorFrom');
    if (!toId) errors.to = t('home.errorTo');
    if (fromId && toId && fromId === toId) errors.to = t('home.errorSame');
    if (!isIsoDate(date)) errors.date = req;
    if (!isClockTime(time)) errors.time = req;
    if (fareN === null || fareN <= 0) errors.fare = t('refund.errorFare');
    if (scN === null || scN < 0) errors.sc = t('refund.errorServiceCharge');
  }
  if (fileError) errors.file = fileError === 'type' ? t('tickets.errorFileType') : t('tickets.errorFileSize', { max: formatBytes(MAX_TICKET_FILE_BYTES) });

  const onFile = (picked: File | undefined) => {
    setSaveError(null);
    if (!picked) {
      setFile(null);
      return;
    }
    const problem = checkTicketFile(picked);
    setFileError(problem);
    setFile(problem ? null : picked);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setSaveError(null);
    // Written out in full so TypeScript can narrow every value used below.
    if (
      !file ||
      fileError ||
      !trimmedTrain ||
      !fromId ||
      !toId ||
      fromId === toId ||
      !isIsoDate(date) ||
      !isClockTime(time) ||
      fareN === null ||
      fareN <= 0 ||
      scN === null ||
      scN < 0
    ) {
      const invalid: Record<Field, boolean> = {
        file: !file || Boolean(fileError),
        train: !trimmedTrain,
        from: !fromId,
        to: !toId || fromId === toId,
        date: !isIsoDate(date),
        time: !isClockTime(time),
        fare: fareN === null || fareN <= 0,
        sc: scN === null || scN < 0,
      };
      const first = ORDER.find((k) => invalid[k]);
      if (first) document.getElementById(`ticket-${first}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const data = await file.arrayBuffer(); // stored as-is; never read or parsed
      const train = known.status === 'ready' ? known.data : null;
      const trip = train ? await getTrip({ trainId: train.id, date, fromStationId: fromId, toStationId: toId }) : null;
      const ticket = buildTicket({
        id: newId(),
        now: new Date(),
        file: { name: file.name, type: file.type || 'application/octet-stream', size: file.size, data },
        trainNumber: trimmedTrain,
        fromStationId: fromId,
        toStationId: toId,
        travelDate: date,
        departureTime: time,
        coach,
        seat,
        reference,
        fareLkr: fareN,
        serviceChargeLkr: scN,
        trip,
      });
      await tickets.put(ticket);
      void requestPersistence();
      void navigate(`/tickets/${encodeURIComponent(ticket.id)}`, { replace: true });
    } catch (err) {
      setSaveError(err instanceof StorageError ? err.reason : 'unknown');
    } finally {
      setSaving(false);
    }
  };

  const input = (err?: string) => `tap w-full rounded-xl border bg-surface px-3 py-2 text-lg ${err ? 'border-danger' : 'border-border'}`;
  const label = 'mb-1 block text-sm font-semibold text-muted';
  const errText = (k: Field) =>
    errors[k] ? (
      <p id={`ticket-${k}-err`} className="mt-1 text-sm font-semibold text-danger">
        {errors[k]}
      </p>
    ) : null;
  const describedBy = (k: Field, ...extra: string[]) => [...extra, errors[k] && `ticket-${k}-err`].filter(Boolean).join(' ') || undefined;

  return (
    <>
      <PageHeader title={t('screens.ticketNew')} back="/tickets" />
      <div className="mx-auto grid max-w-2xl gap-4 p-4">
        <Notice title={t('common.notConfirmed')}>{t('tickets.noParse')}</Notice>
        <Card>
          <form noValidate onSubmit={(e) => void submit(e)} className="grid gap-3">
            <div>
              <label htmlFor="ticket-file" className={label}>
                {t('tickets.file')}
              </label>
              <input
                id="ticket-file"
                type="file"
                accept={TICKET_FILE_ACCEPT}
                onChange={(e) => onFile(e.target.files?.[0])}
                aria-describedby={describedBy('file', 'ticket-file-hint')}
                aria-invalid={errors.file ? true : undefined}
                className="tap block w-full text-base file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface-2 file:px-3 file:py-2 file:font-semibold"
              />
              <p id="ticket-file-hint" className="mt-1 text-sm text-muted">
                {t('tickets.fileHint', { max: formatBytes(MAX_TICKET_FILE_BYTES) })}
              </p>
              {file && <p className="text-sm font-semibold">{t('tickets.fileChosen', { name: file.name, size: formatBytes(file.size) })}</p>}
              {errText('file')}
            </div>

            <div>
              <label htmlFor="ticket-train" className={label}>
                {t('tickets.trainNumber')}
              </label>
              <input
                id="ticket-train"
                inputMode="numeric"
                value={trainNumber}
                onChange={(e) => setTrainNumber(e.target.value)}
                aria-describedby={describedBy('train', 'ticket-train-hint', 'ticket-train-match')}
                aria-invalid={errors.train ? true : undefined}
                className={input(errors.train)}
              />
              <p id="ticket-train-hint" className="mt-1 text-sm text-muted">
                {t('tickets.trainHint')}
              </p>
              <p id="ticket-train-match" aria-live="polite" className="text-sm font-semibold">
                {trimmedTrain && known.status === 'ready'
                  ? known.data
                    ? t('tickets.trainFound', { train: f.train(known.data) })
                    : t('tickets.trainUnknown')
                  : null}
              </p>
              {errText('train')}
            </div>

            <StationPicker
              id="ticket-from"
              label={t('home.from')}
              dialogTitle={t('picker.fromTitle')}
              value={(fromId && stations?.get(fromId)) || null}
              onChange={(s) => setFromId(s.id)}
              error={errors.from}
            />
            <StationPicker
              id="ticket-to"
              label={t('home.to')}
              dialogTitle={t('picker.toTitle')}
              value={(toId && stations?.get(toId)) || null}
              onChange={(s) => setToId(s.id)}
              error={errors.to}
            />

            <div className="grid gap-3 min-[400px]:grid-cols-2">
              <div>
                <label htmlFor="ticket-date" className={label}>
                  {t('tickets.travelDate')}
                </label>
                <input
                  id="ticket-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-describedby={describedBy('date', 'ticket-chosen')}
                  aria-invalid={errors.date ? true : undefined}
                  className={input(errors.date)}
                />
                {errText('date')}
              </div>
              <div>
                <label htmlFor="ticket-time" className={label}>
                  {t('tickets.departureTime')}
                </label>
                <input
                  id="ticket-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  aria-describedby={describedBy('time', 'ticket-time-hint', 'ticket-chosen')}
                  aria-invalid={errors.time ? true : undefined}
                  className={input(errors.time)}
                />
                {errText('time')}
              </div>
            </div>
            <p id="ticket-time-hint" className="-mt-2 text-sm text-muted">
              {t('tickets.departureHint')}
            </p>
            <ChosenDateTime id="ticket-chosen" date={date} time={time} />

            <div className="grid gap-3 min-[400px]:grid-cols-2">
              <div>
                <label htmlFor="ticket-coach" className={label}>
                  {t('tickets.coach')}
                </label>
                <input id="ticket-coach" value={coach} onChange={(e) => setCoach(e.target.value)} className={input()} />
              </div>
              <div>
                <label htmlFor="ticket-seat" className={label}>
                  {t('tickets.seat')}
                </label>
                <input id="ticket-seat" value={seat} onChange={(e) => setSeat(e.target.value)} className={input()} />
              </div>
            </div>
            <div>
              <label htmlFor="ticket-reference" className={label}>
                {t('tickets.reference')}
              </label>
              <input id="ticket-reference" value={reference} onChange={(e) => setReference(e.target.value)} className={input()} />
            </div>

            <div>
              <label htmlFor="ticket-fare" className={label}>
                {t('refund.fare')}
              </label>
              <input
                id="ticket-fare"
                inputMode="decimal"
                value={fare}
                onChange={(e) => setFare(e.target.value)}
                aria-describedby={describedBy('fare', 'ticket-fare-hint')}
                aria-invalid={errors.fare ? true : undefined}
                className={input(errors.fare)}
              />
              <p id="ticket-fare-hint" className="mt-1 text-sm text-muted">
                {t('refund.fareHint')}
              </p>
              {errText('fare')}
            </div>
            <div>
              <label htmlFor="ticket-sc" className={label}>
                {t('refund.serviceCharge')}
              </label>
              <input
                id="ticket-sc"
                inputMode="decimal"
                value={scText}
                onChange={(e) => setSc(e.target.value)}
                aria-describedby={describedBy('sc', 'ticket-sc-hint')}
                aria-invalid={errors.sc ? true : undefined}
                className={input(errors.sc)}
              />
              <p id="ticket-sc-hint" className="mt-1 text-sm text-muted">
                {t('refund.serviceChargeHint', { percent: CONVENIENCE_FEE_RATE * 100 })}
              </p>
              {errText('sc')}
            </div>

            {saveError && (
              <Notice tone="danger">
                <span role="alert">
                  {saveError === 'full'
                    ? t('tickets.saveFailedFull')
                    : saveError === 'unavailable'
                      ? t('tickets.saveFailedUnavailable')
                      : t('tickets.saveFailed')}
                </span>
              </Notice>
            )}
            <Button type="submit" size="lg" disabled={saving}>
              {t('tickets.save')}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
