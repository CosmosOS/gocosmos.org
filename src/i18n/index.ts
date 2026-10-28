import { createContext, useContext } from 'react';
import type { Strings } from './types';
import { en } from './en';
import { fr } from './fr';
import { zh } from './zh';

export type { Strings, SpecKey, Era } from './types';

export type Locale = 'en' | 'fr' | 'zh';

export interface LocaleInfo {
  code: Locale;
  /** BCP 47 tag for <html lang>, hreflang and Intl. */
  lang: string;
  /** Where the prerendered page lives (scripts/prerender.mjs writes one per locale). */
  path: string;
  /** Short label in the nav switcher. */
  label: string;
  /** The language's own name, for the switcher link's accessible name. */
  name: string;
}

/* English is the reference and lives at the root; the others are sub-paths.
   No automatic redirect: the visitor picks, crawlers see a stable page. */
export const LOCALES: readonly LocaleInfo[] = [
  { code: 'en', lang: 'en', path: '/', label: 'EN', name: 'English' },
  { code: 'fr', lang: 'fr', path: '/fr/', label: 'FR', name: 'Français' },
  { code: 'zh', lang: 'zh-Hans', path: '/zh/', label: '中文', name: '中文（简体）' },
];

export const STRINGS: Record<Locale, Strings> = { en, fr, zh };

export function localeInfo(code: Locale): LocaleInfo {
  return LOCALES.find(l => l.code === code) ?? LOCALES[0];
}

/** `/fr/...` → fr, `/zh/...` → zh, anything else → en. */
export function localeFromPath(pathname: string): Locale {
  const seg = pathname.split('/')[1];
  return seg === 'fr' || seg === 'zh' ? seg : 'en';
}

const I18nContext = createContext<Locale>('en');
export const I18nProvider = I18nContext.Provider;

export function useI18n() {
  const locale = useContext(I18nContext);
  return { locale, t: STRINGS[locale], info: localeInfo(locale) };
}
