import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import { readPref, writePref } from '@/lib/prefs';

export const LANGUAGES = [
  { code: 'en', nativeName: 'English' },
  { code: 'si', nativeName: 'සිංහල' },
  { code: 'ta', nativeName: 'தமிழ்' },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: typeof en };
    returnNull: false;
  }
}

// English ships in the main bundle; Sinhala and Tamil load on demand
// (they are still precached by the service worker for offline use).
const loaders: Record<Exclude<Language, 'en'>, () => Promise<{ default: unknown }>> = {
  si: () => import('./si'),
  ta: () => import('./ta'),
};

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export function isLanguage(v: string | null): v is Language {
  return LANGUAGES.some((l) => l.code === v);
}

export function getSavedLanguage(): Language {
  const saved = readPref('lang');
  if (isLanguage(saved)) return saved;
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en';
  return isLanguage(nav) ? nav : 'en';
}

export async function setLanguage(lng: Language): Promise<void> {
  if (lng !== 'en' && !i18n.hasResourceBundle(lng, 'translation')) {
    const mod = await loaders[lng]();
    i18n.addResourceBundle(lng, 'translation', mod.default, true, true);
  }
  await i18n.changeLanguage(lng);
  document.documentElement.lang = lng;
  writePref('lang', lng);
}

export default i18n;
