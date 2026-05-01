import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, mockUser, mockAdmin } from '../data/mockData';

const LANGUAGE_STORAGE_KEY = 'app_language';

interface AppContextType {
    currentUser: User;
    setCurrentUser: (user: User) => void;
    switchToUser: () => void;
    switchToAdmin: () => void;
    language: 'en' | 'ar' | 'fr';
    setLanguage: (lang: 'en' | 'ar' | 'fr') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User>(mockUser);
    const [language, setLanguageState] = useState<'en' | 'ar' | 'fr'>('en');

    // Load saved language on mount
    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
                if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar' || savedLanguage === 'fr')) {
                    setLanguageState(savedLanguage);
                }
            } catch (error) {
                console.error('Failed to load language from storage:', error);
            }
        };
        loadLanguage();
    }, []);

    // Persist language whenever it changes
    const setLanguage = async (lang: 'en' | 'ar' | 'fr') => {
        setLanguageState(lang);
        try {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        } catch (error) {
            console.error('Failed to save language to storage:', error);
        }
    };

    const switchToUser = () => setCurrentUser(mockUser);
    const switchToAdmin = () => setCurrentUser(mockAdmin);

    return (
        <AppContext.Provider value={{
            currentUser,
            setCurrentUser,
            switchToUser,
            switchToAdmin,
            language,
            setLanguage
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};
