import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, AuthUser } from '../services/api';

export interface User {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    phoneVerified: boolean;
    role: 'USER' | 'ADMIN' | 'PREMIUM';
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string, name: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    phoneLogin: (phone: string, firebaseIdToken?: string) => Promise<{ success: boolean; error?: string }>;
    verifyPhone: (phone: string, firebaseUid?: string) => Promise<{ success: boolean; error?: string }>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for stored user on mount
    useEffect(() => {
        checkStoredUser();
    }, []);

    const checkStoredUser = async () => {
        try {
            const storedUser = await authApi.getStoredUser();
            if (storedUser) {
                setUser(storedUser as User);
            }
        } catch (error) {
            console.error('Error checking stored user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshUser = async () => {
        try {
            const freshUser = await authApi.getMe();
            setUser(freshUser as User);
        } catch (error) {
            console.error('Error refreshing user:', error);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const { user: loggedInUser } = await authApi.login(email, password);
            setUser(loggedInUser);
            return { success: true };
        } catch (error: any) {
            const message = error.response?.data?.error || 'Login failed';
            return { success: false, error: message };
        }
    };

    const register = async (email: string, password: string, name: string, phone?: string) => {
        try {
            const { user: newUser } = await authApi.register(email, password, name, phone);
            setUser(newUser);
            return { success: true };
        } catch (error: any) {
            const message = error.response?.data?.error || 'Registration failed';
            return { success: false, error: message };
        }
    };

    const phoneLogin = async (phone: string, firebaseIdToken?: string) => {
        try {
            const { user: loggedInUser } = await authApi.phoneLogin(phone, firebaseIdToken);
            setUser(loggedInUser);
            return { success: true };
        } catch (error: any) {
            const message = error.response?.data?.error || 'Phone login failed';
            return { success: false, error: message };
        }
    };

    const verifyPhone = async (phone: string, firebaseUid?: string) => {
        try {
            const { user: updatedUser } = await authApi.verifyPhone(phone, firebaseUid);
            setUser(updatedUser);
            return { success: true };
        } catch (error: any) {
            const message = error.response?.data?.error || 'Phone verification failed';
            return { success: false, error: message };
        }
    };

    const logout = async () => {
        await authApi.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                isAdmin: user?.role === 'ADMIN',
                login,
                register,
                logout,
                phoneLogin,
                verifyPhone,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
