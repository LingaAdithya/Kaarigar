'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { translateText } from '@/ai/flows/translate-text';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define the shape of the context
interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (text: string) => string;
  isTranslating: (text: string) => boolean;
  registerText: (text: string) => void;
}

// Create the context with a default value
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation cache state
type TranslationCache = { [key: string]: { [lang: string]: string } };

const CACHE_KEY = 'translation_cache';

// Provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState('English');
  const [cache, setCache] = useState<TranslationCache>({});
  const [pending, setPending] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    // Load language from localStorage
    const storedLang = localStorage.getItem('language');
    if (storedLang) {
      setLanguageState(storedLang);
    }
    
    // Load cache from localStorage
    try {
      const storedCache = localStorage.getItem(CACHE_KEY);
      if (storedCache) {
        setCache(JSON.parse(storedCache));
      }
    } catch (error) {
      console.error("Failed to parse translation cache from localStorage", error);
    }
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const isTranslating = useCallback((text: string): boolean => {
    if (language === 'English' || !text) return false;
    const cacheKey = text.toLowerCase();
    const isTranslated = cache[cacheKey] && cache[cacheKey][language];
    return !isTranslated;
  }, [language, cache]);


  const t = useCallback((text: string): string => {
    if (!text || typeof text !== 'string') return '';
    if (language === 'English' || !language) {
      return text;
    }

    const cacheKey = text.toLowerCase();
    
    // Immediately return from cache if available
    if (cache[cacheKey] && cache[cacheKey][language]) {
      return cache[cacheKey][language];
    }
    
    // Return empty string while loading, translation is handled by useEffect
    return ''; 
  }, [language, cache]);

  // This is a new function that is not part of the context, but is used by the T component.
  // It registers the text that needs to be translated.
  const registerText = useCallback((text: string) => {
    if (!text || typeof text !== 'string') return;
    const cacheKey = text.toLowerCase();
    if (!cache[cacheKey]) {
        // Using a timeout to batch state updates and avoid render-time setState calls.
        setTimeout(() => setCache(prev => {
          if (prev[cacheKey]) return prev;
          return { ...prev, [cacheKey]: {} }
        }), 0);
    }
  }, [cache]);


   // Effect to handle the actual translation for texts that have been "registered" by the T component.
  useEffect(() => {
    const textsToTranslate = Object.keys(cache);
    
    textsToTranslate.forEach(text => {
        const cacheKey = text.toLowerCase();
        // Check if translation is needed for the current language
        if (language !== 'English' && !(cache[cacheKey] && cache[cacheKey][language]) && !pending[cacheKey + language]) {
            setTimeout(() => {
                setPending(prev => ({...prev, [cacheKey+language]: true}));
                translateText({ text, targetLanguage: language })
                    .then(result => {
                        setCache(prevCache => {
                            const newCache = { ...prevCache };
                            if (!newCache[cacheKey]) {
                                newCache[cacheKey] = {};
                            }
                            newCache[cacheKey][language] = result.translation;
                             // Save to localStorage
                            try {
                                localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
                            } catch (error) {
                                console.error("Failed to save translation cache to localStorage", error);
                            }
                            return newCache;
                        });
                    })
                    .catch(err => console.error(`Translation failed for: "${text}"`, err))
                    .finally(() => {
                        setPending(prev => ({...prev, [cacheKey+language]: false}));
                    });
            }, 0);
        }
    });
  }, [language, cache, pending]);


  const value = {
      language,
      setLanguage,
      t,
      isTranslating,
      registerText
  };


  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use the language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Translated text component
export function T({ children }: { children: string }) {
    const { language, t, isTranslating, registerText } = useLanguage();

    useEffect(() => {
        if (children && language !== 'English') {
            registerText(children);
        }
    }, [children, language, registerText]);

    if (!children || typeof children !== 'string') return null;
    
    const isMidTranslation = isTranslating(children);
    const translatedText = t(children);

    if (language !== 'English' && isMidTranslation && !translatedText) {
        return <span className="inline-block w-2 h-2 bg-current rounded-full animate-pulse"></span>;
    }
    
    return <>{translatedText || children}</>;
}


export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  
  const languages = [
    { name: 'English', script: 'English' },
    { name: 'Hindi', script: 'हिन्दी' },
    { name: 'Tamil', script: 'தமிழ்' },
    { name: 'Bengali', script: 'বাংলা' },
  ];

  return (
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
            {languages.map(lang => (
                <SelectItem key={lang.name} value={lang.name}>{lang.script}</SelectItem>
            ))}
        </SelectContent>
    </Select>
  )
}
