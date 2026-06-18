import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

export const supportedLngs = {
    en: 'English',
    id: 'Bahasa Indonesia',
};

i18n.use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        supportedLngs: Object.keys(supportedLngs),
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
        backend: {
            loadPath: '/js/i18n/locales/{{lng}}/{{ns}}.json',
        },
        ns: ['translation'],
        defaultNS: 'translation',
    });

export default i18n;
