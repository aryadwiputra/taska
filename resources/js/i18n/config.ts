import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from '@/i18n/locales/en/translation.json';
import id from '@/i18n/locales/id/translation.json';

export const supportedLngs = {
    en: 'English',
    id: 'Bahasa Indonesia',
};

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        supportedLngs: Object.keys(supportedLngs),
        resources: {
            en: { translation: en },
            id: { translation: id },
        },
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
        ns: ['translation'],
        defaultNS: 'translation',
    });

export default i18n;
