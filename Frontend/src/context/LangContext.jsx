import { createContext, useContext, useState } from 'react';
import { t } from '../i18n';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState('hi'); // default Hindi first
  const toggle = () => setLang(l => (l === 'hi' ? 'en' : 'hi'));
  const tr = (key) => t[lang][key] ?? t['en'][key] ?? key;
  return (
    <LangContext.Provider value={{ lang, toggle, tr }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
