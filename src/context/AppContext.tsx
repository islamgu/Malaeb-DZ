import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, mockUser, mockAdmin } from '../data/mockData';

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
    const [language, setLanguage] = useState<'en' | 'ar' | 'fr'>('en');

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
