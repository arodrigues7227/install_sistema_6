// src/translate/i18n.js
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { messages } from "./languages";

// Função para normalizar códigos de idioma
const normalizeLanguageCode = (lang) => {
  if (!lang) return 'pt';
  
  // Remove espaços e converte para minúsculas
  const normalizedLang = lang.toLowerCase().trim();
  
  // Mapeamento de variações para códigos padrão
  const languageMap = {
    'pt': 'pt',
    'pt-br': 'pt',
    'ptbr': 'pt',
    'pt_br': 'pt',
    'portuguese': 'pt',
    'português': 'pt',
    'en': 'en',
    'en-us': 'en',
    'enus': 'en',
    'en_us': 'en',
    'english': 'en',
    'es': 'es',
    'es-es': 'es',
    'eses': 'es',
    'es_es': 'es',
    'spanish': 'es',
    'español': 'es'
  };

  return languageMap[normalizedLang] || 'pt';
};

// Configuração do detector de idioma personalizado
const languageDetector = new LanguageDetector();
languageDetector.addDetector({
  name: 'customDetector',
  lookup() {
    const storedLang = localStorage.getItem('language');
    return normalizeLanguageCode(storedLang);
  },
  cacheUserLanguage(lng) {
    const normalizedLang = normalizeLanguageCode(lng);
    localStorage.setItem('language', normalizedLang);
  }
});

i18n
  .use(languageDetector)
  .init({
    debug: false,
    fallbackLng: 'pt',
    defaultNS: ["translations"],
    ns: ["translations"],
    resources: messages,
    detection: {
      order: ['customDetector', 'localStorage', 'navigator'],
      lookupLocalStorage: 'language',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
      formatSeparator: ',',
    },
    react: {
      useSuspense: false,
    }
  });

// Garantir que o idioma atual está normalizado
const currentLanguage = localStorage.getItem('language');
const normalizedLanguage = normalizeLanguageCode(currentLanguage);
if (currentLanguage !== normalizedLanguage) {
  localStorage.setItem('language', normalizedLanguage);
}

export { i18n, normalizeLanguageCode };