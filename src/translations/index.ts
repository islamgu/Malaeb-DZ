import { useApp } from '../context/AppContext';
import { en, TranslationKeys } from './en';
import { ar } from './ar';
import { fr } from './fr';

export type Language = 'en' | 'ar' | 'fr';

const translations: Record<Language, TranslationKeys> = {
    en,
    ar,
    fr,
};

export const useTranslation = () => {
    const { language } = useApp();

    const t = translations[language] || translations.en;
    const isRTL = language === 'ar';

    return { t, isRTL, language };
};

export { en, ar, fr, TranslationKeys };
