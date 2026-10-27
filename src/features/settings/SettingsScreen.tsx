import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { LANGUAGES, setLanguage, type Language } from '@/i18n';
import { useTheme, type ThemeChoice } from '@/hooks/useTheme';

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
  const { theme, setTheme } = useTheme();
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
      </div>
    </>
  );
}
