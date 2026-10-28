import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { BellIcon, CheckIcon } from '@/components/icons';
import { notificationState, requestNotificationPermission, type NotificationState } from '@/lib/notify';

/**
 * Clear permission prompt. The browser's own prompt only appears after the user taps
 * "Turn on alerts" here; if alerts are denied or unsupported, we say what still works.
 */
export function NotificationPermissionCard() {
  const { t } = useTranslation();
  const [state, setState] = useState<NotificationState>(notificationState);

  return (
    <Card>
      <section aria-labelledby="perm-title" className="grid gap-2" aria-live="polite">
        {state === 'default' && (
          <>
            <h2 id="perm-title" className="flex items-center gap-2 text-lg font-bold">
              <BellIcon className="shrink-0 text-accent" />
              {t('reminders.permDefaultTitle')}
            </h2>
            <p>{t('reminders.permDefaultBody')}</p>
            <Button size="lg" onClick={() => void requestNotificationPermission().then(setState)}>
              {t('reminders.permAllow')}
            </Button>
          </>
        )}
        {state === 'granted' && (
          <p id="perm-title" className="flex items-center gap-2 font-semibold text-ok">
            <CheckIcon className="shrink-0" />
            {t('reminders.permGranted')}
          </p>
        )}
        {state === 'denied' && (
          <Notice tone="warn">
            <span id="perm-title">{t('reminders.permDenied')}</span>
          </Notice>
        )}
        {state === 'unsupported' && (
          <Notice tone="warn">
            <span id="perm-title">{t('reminders.permUnsupported')}</span>
          </Notice>
        )}
      </section>
    </Card>
  );
}
