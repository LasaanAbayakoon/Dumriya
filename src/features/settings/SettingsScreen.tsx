import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Notice } from '@/components/Notice';
import { TrashIcon } from '@/components/icons';
import { getSavedLanguage, LANGUAGES, setLanguage, type Language } from '@/i18n';
import { clearAllData } from '@/lib/storage';
import { useTheme, type ThemeChoice } from '@/hooks/useTheme';
import { StorageInfo } from './StorageInfo';

function RadioGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  name: string;
  value: T;
  options: readonly { value: T; label: string; lang?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-lg font-bold">{legend}</legend>
      <div className="grid gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="tap flex items-center gap-3 rounded-xl border border-border px-3 py-2 has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="size-5 accent-[var(--accent)]"
            />
            <span lang={o.lang} className="font-semibold [overflow-wrap:anywhere]">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, resetTheme } = useTheme();
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState<null | 'ok' | 'partial'>(null);

  const deleteAll = async () => {
    const { ok } = await clearAllData();
    // Back to defaults without saving them again.
    resetTheme();
    const lng = getSavedLanguage();
    setLang(lng);
    await setLanguage(lng, { persist: false });
    setConfirming(false);
    setCleared(ok ? 'ok' : 'partial');
  };
  // Selected immediately on tap; the Sinhala/Tamil bundle may take a moment to load.
  const [lang, setLang] = useState<Language>(i18n.language as Language);
  const chooseLanguage = (l: Language) => {
    setLang(l);
    void setLanguage(l);
  };

  const themes: { value: ThemeChoice; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];

  return (
    <>
      <PageHeader title={t('screens.settings')} back />
      <div className="mx-auto grid max-w-2xl gap-4 p-4">
        <Card>
          <RadioGroup<Language>
            legend={t('settings.language')}
            name="language"
            value={lang}
            options={LANGUAGES.map((l) => ({ value: l.code, label: l.nativeName, lang: l.code }))}
            onChange={chooseLanguage}
          />
        </Card>
        <Card>
          <RadioGroup<ThemeChoice> legend={t('settings.theme')} name="theme" value={theme} options={themes} onChange={setTheme} />
        </Card>
        <Card>
          <section aria-labelledby="data-title" className="grid gap-3">
            <h2 id="data-title" className="text-lg font-bold">
              {t('settings.dataTitle')}
            </h2>
            <p>{t('settings.dataBody')}</p>
            <StorageInfo version={cleared ? 1 : 0} />
            {cleared && (
              <Notice tone={cleared === 'ok' ? 'info' : 'danger'}>
                <span role="status">{cleared === 'ok' ? t('settings.deletedAll') : t('settings.deleteAllFailed')}</span>
              </Notice>
            )}
            <Button variant="danger" icon={<TrashIcon />} onClick={() => setConfirming(true)}>
              {t('settings.deleteAll')}
            </Button>
          </section>
        </Card>
      </div>
      {confirming && (
        <Dialog title={t('settings.deleteAllTitle')} onClose={() => setConfirming(false)}>
          <div className="grid gap-3 p-4">
            <p>{t('settings.deleteAllBody')}</p>
            <Button variant="danger" size="lg" onClick={() => void deleteAll()}>
              {t('settings.deleteAllConfirm')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {t('settings.cancel')}
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
