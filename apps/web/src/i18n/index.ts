import enCommon from '../../../../locales/en/common.json';
import esCommon from '../../../../locales/es/common.json';
import jaCommon from '../../../../locales/ja/common.json';
import enWeb from '../../../../locales/en/web.json';
import esWeb from '../../../../locales/es/web.json';
import jaWeb from '../../../../locales/ja/web.json';

export const supportedLocales = ['en', 'es', 'ja'] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = 'en';

function merge(...objects: Record<string, unknown>[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const obj of objects) {
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && typeof result[key] === 'object') {
        result[key] = merge(result[key] as Record<string, unknown>, value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

const translations: Record<Locale, Record<string, unknown>> = {
  en: merge(enCommon, enWeb),
  es: merge(esCommon, esWeb),
  ja: merge(jaCommon, jaWeb),
};

/**
 * Resolve a dot-separated key from a nested object.
 */
function resolve(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Create a translation function for a specific locale.
 *
 * @example
 * ```astro
 * ---
 * import { useTranslations, getLocaleFromUrl } from '../i18n';
 * const locale = getLocaleFromUrl(Astro.url);
 * const t = useTranslations(locale);
 * ---
 * <h1>{t('sidebar.subtitle')}</h1>
 * ```
 */
export function useTranslations(locale: Locale) {
  const dict = translations[locale] ?? translations[defaultLocale];
  const fallback = translations[defaultLocale];

  return function t(key: string): string {
    return resolve(dict, key) ?? resolve(fallback, key) ?? key;
  };
}

/**
 * Extract the locale from an Astro URL path.
 * `/es/docs/getting-started` → 'es'
 * `/docs/getting-started` → 'en' (default)
 */
export function getLocaleFromUrl(url: URL): Locale {
  const [, segment] = url.pathname.split('/');
  if (supportedLocales.includes(segment as Locale)) {
    return segment as Locale;
  }
  return defaultLocale;
}

/**
 * Get the equivalent path in another locale.
 * Strips the current locale prefix and adds the new one.
 */
export function getLocalizedPath(path: string, locale: Locale): string {
  // Remove any existing locale prefix
  let cleanPath = path;
  for (const loc of supportedLocales) {
    if (cleanPath.startsWith(`/${loc}/`) || cleanPath === `/${loc}`) {
      cleanPath = cleanPath.slice(loc.length + 1) || '/';
      break;
    }
  }

  // Add new locale prefix (skip for default locale)
  if (locale === defaultLocale) {
    return cleanPath;
  }
  return `/${locale}${cleanPath}`;
}

/**
 * Language metadata for the switcher UI.
 */
export const languageMeta: Record<Locale, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇺🇸' },
  es: { label: 'Español', flag: '🇪🇸' },
  ja: { label: '日本語', flag: '🇯🇵' },
};
