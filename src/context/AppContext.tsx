import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, mockUser, mockAdmin } from '../data/mockData';

const LANGUAGE_STORAGE_KEY = 'app_language';
const THEME_STORAGE_KEY = 'app_theme';

// Theme colors
export const lightTheme = {
    background: '#FAFAFA',
    card: '#FFFFFF',
    foreground: '#0F172A',
    text: '#0F172A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    inputBg: '#F3F4F6',
    primary: '#22C55E',
    primaryDark: '#16A34A',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    statusBar: 'dark-content' as const,
};

export const darkTheme = {
    background: '#0F172A',
    card: '#1E293B',
    foreground: '#F1F5F9',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    border: '#334155',
    borderLight: '#1E293B',
    inputBg: '#334155',
    primary: '#22C55E',
    primaryDark: '#16A34A',
    tabBar: '#1E293B',
    tabBarBorder: '#334155',
    statusBar: 'light-content' as const,
};

export type ThemeColors = typeof lightTheme;

interface AppContextType {
    currentUser: User;
    setCurrentUser: (user: User) => void;
    switchToUser: () => void;
    switchToAdmin: () => void;
    language: 'en' | 'ar' | 'fr';
    setLanguage: (lang: 'en' | 'ar' | 'fr') => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    theme: ThemeColors;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User>(mockUser);
    const [language, setLanguageState] = useState<'en' | 'ar' | 'fr'>('en');
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Load saved preferences on mount
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const [savedLanguage, savedTheme] = await Promise.all([
                    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
                    AsyncStorage.getItem(THEME_STORAGE_KEY),
                ]);
                if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar' || savedLanguage === 'fr')) {
                    setLanguageState(savedLanguage);
                }
                if (savedTheme === 'dark') {
                    setIsDarkMode(true);
                }
            } catch (error) {
                console.error('Failed to load preferences:', error);
            }
        };
        loadPreferences();
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

    // Toggle and persist dark mode
    const toggleDarkMode = async () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode ? 'dark' : 'light');
        } catch (error) {
            console.error('Failed to save theme to storage:', error);
        }
    };

    const switchToUser = () => setCurrentUser(mockUser);
    const switchToAdmin = () => setCurrentUser(mockAdmin);

    const theme = isDarkMode ? darkTheme : lightTheme;

    return (
        <AppContext.Provider value={{
            currentUser,
            setCurrentUser,
            switchToUser,
            switchToAdmin,
            language,
            setLanguage,
            isDarkMode,
            toggleDarkMode,
            theme,
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
