import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

export interface User {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    role: 'USER' | 'ADMIN' | 'PREMIUM';
    emailVerified: boolean;
}

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseAuthTypes.User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
    signIn: (email: string, password: string) => Promise<{ success: boolean; isAdmin?: boolean; emailVerified?: boolean; error?: string }>;
    sendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
    checkEmailVerified: () => Promise<{ verified: boolean; error?: string }>;
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
                // Check for stored user even without Firebase user (for test mode)
                const storedUser = await authApi.getStoredUser();
                if (storedUser) {
                    setUser(storedUser);
                } else {
                    setUser(null);
                }
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

    // Sign up with email and password, then send verification email
    const signUp = async (email: string, password: string, name?: string) => {
        try {
            // Create Firebase account
            const userCredential = await auth().createUserWithEmailAndPassword(email, password);

            // Send verification email
            await userCredential.user.sendEmailVerification();

            // Register with backend
            try {
                const result = await authApi.register(email, password, undefined, name);
                setUser(result.user);
            } catch (backendError: any) {
                console.error('Backend register error:', backendError);
                // Still return success since Firebase account was created
            }

            return { success: true };
        } catch (error: any) {
            console.error('Sign up error:', error.code, error.message);
            let errorMessage = 'Failed to create account';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak';
            }
            return { success: false, error: errorMessage };
        }
    };

    // Sign in with email and password
    const signIn = async (email: string, password: string) => {
        try {
            // Admin Bypass: skip Firebase completely
            if (email === 'admin@gmail.com' && password === '1234') {
                try {
                    const result = await authApi.login(email, password);
                    setUser({ ...result.user, emailVerified: true });
                    return {
                        success: true,
                        isAdmin: true,
                        emailVerified: true,
                    };
                } catch (backendError: any) {
                    return {
                        success: false,
                        error: backendError.response?.data?.error || 'Invalid admin credentials',
                    };
                }
            }

            // Sign in with Firebase
            const userCredential = await auth().signInWithEmailAndPassword(email, password);
            const isEmailVerified = userCredential.user.emailVerified;

            // Login with backend
            try {
                const result = await authApi.login(email, password);

                // If Firebase says verified, update backend too
                if (isEmailVerified && !result.user.emailVerified) {
                    try {
                        const updatedUser = await authApi.verifyEmail();
                        setUser({ ...result.user, emailVerified: true });
                    } catch (e) {
                        console.error('Failed to sync email verification:', e);
                    }
                } else {
                    setUser(result.user);
                }

                return {
                    success: true,
                    isAdmin: result.user.role === 'ADMIN',
                    emailVerified: isEmailVerified,
                };
            } catch (backendError: any) {
                console.error('Backend login error:', backendError);
                return {
                    success: false,
                    error: backendError.response?.data?.error || 'Invalid credentials',
                };
            }

        } catch (error: any) {
            console.error('Sign in error:', error.code, error.message);
            let errorMessage = 'Invalid credentials';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Invalid password';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many attempts. Please try again later';
            }
            return { success: false, error: errorMessage };
        }
    };

    // Send/resend verification email
    const sendVerificationEmail = async () => {
        try {
            const currentUser = auth().currentUser;
            if (!currentUser) {
                return { success: false, error: 'No user signed in' };
            }
            await currentUser.sendEmailVerification();
            return { success: true };
        } catch (error: any) {
            console.error('Send verification email error:', error);
            return { success: false, error: error.message || 'Failed to send verification email' };
        }
    };

    // Check if email is verified (reloads Firebase user)
    const checkEmailVerified = async () => {
        try {
            const currentUser = auth().currentUser;
            if (!currentUser) {
                return { verified: false, error: 'No user signed in' };
            }

            // Reload to get latest status from Firebase
            await currentUser.reload();
            const updatedUser = auth().currentUser;
            const verified = updatedUser?.emailVerified ?? false;

            if (verified) {
                // Sync with backend
                try {
                    const updatedBackendUser = await authApi.verifyEmail();
                    setUser(prev => prev ? { ...prev, emailVerified: true } : prev);
                } catch (e) {
                    console.error('Failed to sync email verification with backend:', e);
                }
            }

            return { verified };
        } catch (error: any) {
            console.error('Check email verified error:', error);
            return { verified: false, error: error.message || 'Failed to check verification' };
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
                signUp,
                signIn,
                sendVerificationEmail,
                checkEmailVerified,
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
