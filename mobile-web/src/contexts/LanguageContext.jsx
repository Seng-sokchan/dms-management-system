import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from '../locales/en.json';
import km from '../locales/km.json';

const STORAGE_KEY = 'dms-mobile-language';
const SUPPORTED_LANGUAGES = ['en', 'km'];
const translations = { en, km };

const LanguageContext = createContext(null);

function getInitialLanguage() {
  const savedLanguage = localStorage.getItem(STORAGE_KEY);
  if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
    return savedLanguage;
  }
  return 'en';
}

function resolveTranslation(messages, key) {
  return key.split('.').reduce((value, part) => (value ? value[part] : undefined), messages);
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => {
    const messages = translations[language] || translations.en;

    const changeLanguage = (nextLanguage) => {
      const normalized = SUPPORTED_LANGUAGES.includes(nextLanguage) ? nextLanguage : 'en';
      setLanguage(normalized);
      localStorage.setItem(STORAGE_KEY, normalized);
    };

    const toggleLanguage = () => {
      changeLanguage(language === 'en' ? 'km' : 'en');
    };

    const t = (key, fallback = key) => {
      const translated = resolveTranslation(messages, key);
      return translated ?? fallback;
    };

    return {
      language,
      setLanguage: changeLanguage,
      toggleLanguage,
      t,
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
