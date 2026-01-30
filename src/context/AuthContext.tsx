import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

// Real SMS verification - no test bypass

export interface User {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    role: 'USER' | 'ADMIN' | 'PREMIUM';
}

interface VerifyOTPOptions {
    email?: string;
    password?: string;
    phoneNumber?: string;
    isSignUp?: boolean;
}

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseAuthTypes.User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    sendOTP: (phoneNumber: string) => Promise<{ success: boolean; verificationId?: string; error?: string }>;
    verifyCredentials: (email: string, password: string, phone: string) => Promise<{ success: boolean; isAdmin?: boolean; error?: string }>;
    verifyOTP: (verificationId: string, code: string, options?: VerifyOTPOptions) => Promise<{ success: boolean; isAdmin?: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Listen to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged(async (fbUser) => {
            setFirebaseUser(fbUser);

            if (fbUser) {
                // Try to get stored user data
                const storedUser = await authApi.getStoredUser();
                if (storedUser) {
                    setUser(storedUser);
                }
            } else {
                setUser(null);
            }

            setIsLoading(false);
        });

        return unsubscribe;
    }, []);

    // Check for stored user on mount
    useEffect(() => {
        checkStoredUser();
    }, []);

    const checkStoredUser = async () => {
        try {
            const storedUser = await authApi.getStoredUser();
            if (storedUser) {
                setUser(storedUser);
            }
        } catch (error) {
            console.error('Error checking stored user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendOTP = async (phoneNumber: string) => {
        try {
            // Ensure phone number is in E.164 format
            let formattedPhone = phoneNumber.trim();
            if (!formattedPhone.startsWith('+')) {
                formattedPhone = '+213' + formattedPhone.replace(/^0/, '');
            }

            // Send real OTP via Firebase
            const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
            return {
                success: true,
                verificationId: confirmation.verificationId || undefined
            };
        } catch (error: any) {
            console.error('Send OTP error:', error);
            let errorMessage = 'Failed to send verification code';

            if (error.code === 'auth/invalid-phone-number') {
                errorMessage = 'Invalid phone number format';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many attempts. Please try again later';
            } else if (error.code === 'auth/quota-exceeded') {
                errorMessage = 'SMS quota exceeded. Please try again later';
            } else if (error.code === 'auth/app-not-authorized') {
                errorMessage = 'App not authorized. Please check Firebase configuration.';
            }

            return { success: false, error: errorMessage };
        }
    };

    // Verify email, password, and phone with backend before OTP (for login)
    const verifyCredentials = async (email: string, password: string, phone: string) => {
        try {
            const result = await authApi.verifyCredentials(email, password, phone);
            return {
                success: true,
                isAdmin: result.isAdmin,
            };
        } catch (error: any) {
            console.error('Verify credentials error:', error);
            return {
                success: false,
                error: error.message || 'Invalid credentials',
            };
        }
    };

    const verifyOTP = async (verificationId: string, code: string, options?: VerifyOTPOptions) => {
        const { email, password, phoneNumber, isSignUp } = options || {};

        try {
            // Create credential and sign in
            const credential = auth.PhoneAuthProvider.credential(verificationId, code);
            const userCredential = await auth().signInWithCredential(credential);

            const verifiedPhone = userCredential.user.phoneNumber || phoneNumber || '';

            // Sync with backend
            try {
                if (isSignUp && email && password) {
                    // Register new user
                    const result = await authApi.register(email, password, verifiedPhone);
                    setUser(result.user);
                    return { success: true, isAdmin: result.user.role === 'ADMIN' };
                } else if (email && password) {
                    // Login existing user
                    const result = await authApi.login(email, password, verifiedPhone);
                    setUser(result.user);
                    return { success: true, isAdmin: result.user.role === 'ADMIN' };
                } else {
                    // Fallback to phone-only login
                    const result = await authApi.phoneLogin(verifiedPhone, email);
                    setUser(result.user);
                    return { success: true, isAdmin: result.user.role === 'ADMIN' };
                }
            } catch (backendError) {
                console.error('Backend sync error:', backendError);
                return { success: true, isAdmin: false };
            }
        } catch (error: any) {
            console.error('Verify OTP error:', error);
            let errorMessage = 'Invalid verification code';

            if (error.code === 'auth/invalid-verification-code') {
                errorMessage = 'Invalid code. Please check and try again';
            } else if (error.code === 'auth/session-expired') {
                errorMessage = 'Code expired. Please request a new one';
            }

            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        try {
            await auth().signOut();
        } catch (error) {
            console.error('Firebase signout error:', error);
        }
        await authApi.logout();
        setUser(null);
        setFirebaseUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                firebaseUser,
                isLoading,
                isAuthenticated: !!user || !!firebaseUser,
                isAdmin: user?.role === 'ADMIN',
                sendOTP,
                verifyCredentials,
                verifyOTP,
                logout,
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
