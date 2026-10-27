import { useEffect, useRef, useState, type ClipboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { CheckIcon, CopyIcon, ShieldIcon } from '@/components/icons';
import { OFFICIAL_RESERVATION_URL } from '@/config/links';
import { DISPUTE_TYPE_LABEL } from '@/config/policy';
import { copyText } from '@/lib/clipboard';
import {
  acceptLast4,
  buildDisputeText,
  EMPTY_DISPUTE,
  validateDispute,
  type DisputeError,
  type DisputeField,
  type DisputeFields,
} from '@/lib/dispute';
import { OfficialHandoff } from '../book/OfficialHandoff';

/**
 * PRIVACY: the fields live only in this component's state. They are never written to
 * IndexedDB, localStorage, sessionStorage, the URL or history state, and nothing is
 * sent over the network. Leaving the screen unmounts it; `pagehide` clears it too
 * (so a back-forward cache restore shows an empty form). Autofill is turned off.
 */
const ORDER: DisputeField[] = ['name', 'mobile', 'location', 'paidDate', 'paidTime', 'reference', 'last4', 'email'];

const ERROR_KEY: Record<DisputeError, string> = {
  required: 'dispute.errorRequired',
  mobile: 'dispute.errorMobile',
  email: 'dispute.errorEmail',
  last4: 'dispute.errorLast4',
  date: 'dispute.errorDate',
};

export default function DisputeScreen() {
  const { t } = useTranslation();
  const [fields, setFields] = useState<DisputeFields>(EMPTY_DISPUTE);
  const [attempted, setAttempted] = useState(false);
  const [refused, setRefused] = useState(false);
  const [copied, setCopied] = useState<null | 'ok' | 'failed'>(null);
  const nextRef = useRef<HTMLHeadingElement>(null);

  const reset = () => {
    setFields(EMPTY_DISPUTE);
    setAttempted(false);
    setRefused(false);
    setCopied(null);
  };

  useEffect(() => {
    const onHide = () => reset();
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, []);

  const errors = attempted ? validateDispute(fields) : {};
  const set = (k: DisputeField, v: string) => {
    setFields((f) => ({ ...f, [k]: v }));
    setCopied(null);
  };

  const onLast4 = (raw: string) => {
    const r = acceptLast4(raw);
    if ('refused' in r) {
      setRefused(true); // keep the previous value; never store the extra digits
      return;
    }
    setRefused(false);
    set('last4', r.value);
  };
  const onLast4Paste = (e: ClipboardEvent<HTMLInputElement>) => {
    const r = acceptLast4(e.clipboardData.getData('text'));
    if ('refused' in r) {
      e.preventDefault();
      setRefused(true);
    }
  };

  const copyAll = async () => {
    setAttempted(true);
    const errs = validateDispute(fields);
    const first = ORDER.find((k) => errs[k]);
    if (first) {
      document.getElementById(`dispute-${first}`)?.focus();
      return;
    }
    try {
      await copyText(buildDisputeText(fields));
      setCopied('ok');
    } catch {
      setCopied('failed');
    }
    requestAnimationFrame(() => nextRef.current?.focus());
  };

  const hasErrors = Object.keys(errors).length > 0;
  const text = hasErrors || !attempted ? null : buildDisputeText(fields);

  const field = (k: DisputeField, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => {
    const err = errors[k];
    const describedBy = [hint && `dispute-${k}-hint`, err && `dispute-${k}-err`, k === 'last4' && refused && 'dispute-last4-refused']
      .filter(Boolean)
      .join(' ');
    return (
      <div>
        <label htmlFor={`dispute-${k}`} className="mb-1 block text-sm font-semibold text-muted">
          {label}
        </label>
        <input
          id={`dispute-${k}`}
          value={fields[k]}
          onChange={(e) => set(k, e.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={err ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`tap w-full rounded-xl border bg-surface px-3 py-2 text-lg ${err ? 'border-danger' : 'border-border'}`}
          {...props}
        />
        {hint && (
          <p id={`dispute-${k}-hint`} className="mt-1 text-sm text-muted">
            {hint}
          </p>
        )}
        {err && (
          <p id={`dispute-${k}-err`} className="mt-1 text-sm font-semibold text-danger">
            {t(ERROR_KEY[err] as 'dispute.errorRequired')}
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <PageHeader title={t('screens.dispute')} back />
      <div className="mx-auto grid max-w-2xl gap-4 p-4">
        <p>{t('dispute.intro')}</p>
        <p className="flex items-start gap-2 rounded-xl bg-accent-soft p-3 font-semibold" data-testid="privacy-note">
          <ShieldIcon className="mt-0.5 shrink-0 text-accent" />
          <span>{t('dispute.privacy')}</span>
        </p>

        <Card>
          <form noValidate autoComplete="off" onSubmit={(e) => e.preventDefault()} className="grid gap-3">
            {field('name', t('dispute.name'))}
            {field('mobile', t('dispute.mobile'), { type: 'tel', inputMode: 'tel' }, t('dispute.mobileHint'))}
            {field('location', t('dispute.location'), {}, t('dispute.locationHint'))}
            <div className="grid gap-3 min-[400px]:grid-cols-2">
              {field('paidDate', t('dispute.paidDate'), { type: 'date' })}
              {field('paidTime', t('dispute.paidTime'), { type: 'time' })}
            </div>
            {field('reference', t('dispute.reference'), {}, t('dispute.referenceHint'))}
            {field(
              'last4',
              t('dispute.last4'),
              { inputMode: 'numeric', onChange: (e) => onLast4(e.target.value), onPaste: onLast4Paste },
              t('dispute.last4Hint'),
            )}
            {refused && (
              <p id="dispute-last4-refused" role="alert" className="-mt-2 text-sm font-semibold text-danger">
                {t('dispute.refusedFullCard')}
              </p>
            )}
            {field('email', t('dispute.email'), { type: 'email', inputMode: 'email' })}

            {attempted && hasErrors && (
              <Notice tone="danger">
                <span role="alert">{t('dispute.fixErrors')}</span>
              </Notice>
            )}
            <Button size="lg" icon={copied === 'ok' ? <CheckIcon /> : <CopyIcon />} onClick={() => void copyAll()}>
              {t('dispute.copyAll')}
            </Button>
            <Button variant="ghost" onClick={reset}>
              {t('dispute.clear')}
            </Button>
          </form>
        </Card>

        {text && copied && (
          <>
            <Card>
              <section aria-labelledby="dispute-next" className="grid gap-3">
                <h2 id="dispute-next" ref={nextRef} tabIndex={-1} className="text-lg font-bold">
                  {t('dispute.nextTitle')}
                </h2>
                {copied === 'ok' ? (
                  <p role="status" className="flex items-center gap-2 font-semibold text-ok">
                    <CheckIcon className="shrink-0" />
                    {t('copy.copied')}
                  </p>
                ) : (
                  <Notice tone="warn">
                    <span role="alert">{t('copy.failed')}</span>
                  </Notice>
                )}
                <ol className="list-decimal grid gap-1 pl-6">
                  <li>{t('dispute.step1')}</li>
                  <li>{t('dispute.step2', { type: DISPUTE_TYPE_LABEL })}</li>
                  <li>{t('dispute.step3')}</li>
                  <li>{t('dispute.step4')}</li>
                </ol>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-muted">{t('dispute.previewTitle')}</h3>
                  <pre
                    data-testid="dispute-preview"
                    className="overflow-x-auto rounded-xl bg-surface-2 p-3 text-sm whitespace-pre-wrap [overflow-wrap:anywhere] select-all"
                  >
                    {text}
                  </pre>
                  <p className="mt-1 text-sm text-muted">{t('dispute.englishNote')}</p>
                </div>
              </section>
            </Card>
            <OfficialHandoff
              url={OFFICIAL_RESERVATION_URL}
              buttonLabel={t('dispute.openOfficial')}
              title={t('dispute.contactTitle')}
              body={t('dispute.contactBody')}
            />
          </>
        )}
      </div>
    </>
  );
}
