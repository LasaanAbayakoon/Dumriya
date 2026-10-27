import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { copyText } from '@/lib/clipboard';
import { Button } from './Button';
import { CheckIcon, CopyIcon } from './icons';

export function CopyButton({ text, label, className = '' }: { text: string; label?: string; className?: string }) {
  const { t } = useTranslation();
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (state !== 'copied') return;
    const id = setTimeout(() => setState('idle'), 3000);
    return () => clearTimeout(id);
  }, [state]);

  const copy = async () => {
    try {
      await copyText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
  };

  return (
    <div className={className}>
      <Button variant="secondary" icon={state === 'copied' ? <CheckIcon /> : <CopyIcon />} onClick={() => void copy()} className="w-full">
        {state === 'copied' ? t('copy.copied') : (label ?? t('copy.copy'))}
      </Button>
      <span role="status" className="sr-only">
        {state === 'copied' ? t('copy.copied') : ''}
      </span>
      {state === 'failed' && (
        <p role="alert" className="mt-1 text-sm font-semibold text-danger">
          {t('copy.failed')}
        </p>
      )}
    </div>
  );
}
