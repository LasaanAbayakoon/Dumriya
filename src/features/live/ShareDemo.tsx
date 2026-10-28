import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Notice } from '@/components/Notice';
import { ShieldIcon } from '@/components/icons';
import { SHARE_INTERVAL_SECONDS, SHARE_MAX_HOURS, SHARE_PRECISION_METERS } from '@/config/app';

/**
 * "I'm on this train" — PREVIEW ONLY. Explains exactly what a future version would share and
 * when it would stop. This component never calls the geolocation API and sends nothing; the
 * Start button only switches a local "demo running" state (tested).
 */
export function ShareDemo({ trainLabel, terminus }: { trainLabel: string; terminus: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);

  const close = () => {
    setOpen(false);
    setRunning(false);
  };

  return (
    <>
      <Button variant="secondary" size="lg" icon={<ShieldIcon />} onClick={() => setOpen(true)}>
        {t('share.button')}
      </Button>
      {open && (
        <Dialog title={t('share.title')} onClose={close}>
          <div className="grid gap-3 p-4">
            <Notice tone="warn">
              <span className="font-semibold">{t('share.previewNote')}</span>
            </Notice>
            <p>{t('share.intro')}</p>
            <section aria-labelledby="share-what">
              <h3 id="share-what" className="font-bold">
                {t('share.whatTitle')}
              </h3>
              <ul className="list-disc pl-6">
                <li>{t('share.whatLocation', { meters: SHARE_PRECISION_METERS })}</li>
                <li>{t('share.whatTrain', { train: trainLabel })}</li>
                <li>{t('share.whatNothingElse')}</li>
              </ul>
            </section>
            <section aria-labelledby="share-when">
              <h3 id="share-when" className="font-bold">
                {t('share.whenTitle')}
              </h3>
              <p>{t('share.when', { seconds: SHARE_INTERVAL_SECONDS })}</p>
            </section>
            <section aria-labelledby="share-stop">
              <h3 id="share-stop" className="font-bold">
                {t('share.stopTitle')}
              </h3>
              <ul className="list-disc pl-6">
                <li>{t('share.stopArrive', { station: terminus })}</li>
                <li>{t('share.stopHours', { hours: SHARE_MAX_HOURS })}</li>
                <li>{t('share.stopTap')}</li>
                <li>{t('share.stopClose')}</li>
              </ul>
            </section>
            <section aria-labelledby="share-who">
              <h3 id="share-who" className="font-bold">
                {t('share.whoTitle')}
              </h3>
              <p>{t('share.who')}</p>
            </section>
            {running ? (
              <>
                <p role="status" className="rounded-xl bg-accent-soft p-3 font-semibold">
                  {t('share.running', { train: trainLabel })}
                </p>
                <Button variant="secondary" onClick={() => setRunning(false)}>
                  {t('share.stop')}
                </Button>
              </>
            ) : (
              <Button size="lg" onClick={() => setRunning(true)}>
                {t('share.start')}
              </Button>
            )}
            <Button variant="ghost" onClick={close}>
              {t('share.close')}
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
