import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, languages } from '../i18n/translations';

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('tt_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tt_lang', lang);
    } catch {
      // ignore
    }
  }, [lang]);

  function changeLang(code) {
    if (translations[code]) {
      setLang(code);
    }
  }

  function t(key) {
    return translations[lang]?.[key] || translations.en[key] || key;
  }

  return (
    <I18nContext.Provider value={{ lang, changeLang, t, languages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    return { lang: 'en', changeLang: () => {}, t: (k) => k, languages };
  }
  return context;
}