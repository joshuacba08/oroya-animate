import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '../../../locales/en/common.json';
import enDemo from '../../../locales/en/demo.json';
import esCommon from '../../../locales/es/common.json';
import esDemo from '../../../locales/es/demo.json';
import jaCommon from '../../../locales/ja/common.json';
import jaDemo from '../../../locales/ja/demo.json';

export const supportedLanguages = ['en', 'es', 'ja'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, demo: enDemo },
      es: { common: esCommon, demo: esDemo },
      ja: { common: jaCommon, demo: jaDemo },
    },
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    defaultNS: 'demo',
    ns: ['common', 'demo'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'oroya-lang',
    },
  });

export default i18n;
