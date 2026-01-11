import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import heTranslation from './locales/he.json';
import enTranslation from './locales/en.json';

const resources = {
    he: {
        translation: heTranslation
    },
    en: {
        translation: enTranslation
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: localStorage.getItem('language') || 'he', // Default to Hebrew
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // React already escapes
        }
    });

// Update document direction based on language
i18n.on('languageChanged', (lng) => {
    document.documentElement.dir = lng === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
    localStorage.setItem('language', lng);
});

// Set initial direction
document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
document.documentElement.lang = i18n.language;

export default i18n;
