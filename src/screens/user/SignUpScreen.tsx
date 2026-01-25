import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, User, Phone, Smartphone } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../translations';
import { createFirebaseUser, sendEmailVerification } from '../../services/firebase';

export const SignUpScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { login } = useAuth();
    const { t, isRTL } = useTranslation();
    const scrollViewRef = useRef<ScrollView>(null);

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email || !password) {
            Alert.alert(t.common.error, t.auth.fillAllFields);
            return;
        }

        setIsLoading(true);
        try {
            if (isLogin) {
                // Login flow
                const result = await login(email, password);
                if (result.success) {
                    const { user } = await import('../../services/api').then(m => m.authApi.getStoredUser()).then(u => ({ user: u }));
                    if (user?.role === 'ADMIN') {
                        navigation.replace('AdminStack');
                    } else {
                        navigation.replace('UserTabs');
                    }
                } else {
                    Alert.alert(t.common.error, result.error || t.auth.authFailed);
                }
            } else {
                // Signup flow - MFA: Create Firebase user, send email verification
                if (!name) {
                    Alert.alert(t.common.error, t.auth.enterYourName);
                    setIsLoading(false);
                    return;
                }

                // Create Firebase user
                await createFirebaseUser(email, password);

                // Send email verification
                await sendEmailVerification();

                // Navigate to email verification screen
                navigation.navigate('EmailVerification', {
                    email,
                    userData: { name, email, password }
                });
            }
        } catch (error: any) {
            console.error('Auth error:', error);
            let errorMessage = t.auth.somethingWentWrong;

            // Firebase error codes
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = t.auth.emailAlreadyRegistered || 'This email is already registered.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = t.auth.invalidEmail || 'Invalid email address.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = t.auth.weakPassword || 'Password should be at least 6 characters.';
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = t.auth.invalidCredentials || 'Invalid email or password.';
            }

            Alert.alert(t.common.error, errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhoneLogin = () => {
        navigation.navigate('PhoneLogin');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ScrollView
                ref={scrollViewRef}
                className="flex-1 bg-white"
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: insets.top + 24,
                    paddingBottom: insets.bottom + 40,
                    paddingHorizontal: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={{ width: '100%', maxWidth: 400 }}>
                    {/* Logo */}
                    <View className="items-center mb-6">
                        <View className="w-20 h-20 bg-primary rounded-3xl items-center justify-center mb-4 shadow-lg overflow-hidden">
                            <Image
                                source={require('../../../assets/icon.png')}
                                style={{ width: 64, height: 64 }}
                                resizeMode="contain"
                            />
                        </View>
                        <Text className="text-3xl font-bold text-foreground mb-2">
                            {isLogin ? t.auth.welcomeBack : t.auth.createAccount}
                        </Text>
                        <Text className="text-gray-600 text-center">
                            {isLogin ? t.auth.signInToContinue : t.auth.signUpToGetStarted}
                        </Text>
                    </View>

                    {/* Form */}
                    <View className="gap-4">
                        {!isLogin && (
                            <View>
                                <Text className="text-sm text-gray-700 mb-2">{t.auth.name}</Text>
                                <Input
                                    value={name}
                                    onChangeText={setName}
                                    placeholder={t.auth.yourName}
                                    autoCapitalize="words"
                                />
                            </View>
                        )}

                        <View>
                            <Text className="text-sm text-gray-700 mb-2">{t.auth.email}</Text>
                            <Input
                                value={email}
                                onChangeText={setEmail}
                                placeholder="your@email.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View>
                            <Text className="text-sm text-gray-700 mb-2">{t.auth.password}</Text>
                            <Input
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                secureTextEntry
                            />
                            {!isLogin && (
                                <Text className="text-xs text-gray-500 mt-1">
                                    {t.auth.passwordHint || 'At least 6 characters'}
                                </Text>
                            )}
                        </View>

                        {/* MFA Info for signup */}
                        {!isLogin && (
                            <View className="bg-blue-50 rounded-xl p-3 flex-row items-center">
                                <Phone size={16} color="#3b82f6" />
                                <Text className="text-blue-700 text-xs ml-2 flex-1">
                                    {t.auth.mfaInfo || 'After email verification, you\'ll add your phone number for secure two-factor authentication.'}
                                </Text>
                            </View>
                        )}

                        <Button onPress={handleSubmit} disabled={isLoading}>
                            <View className="flex-row items-center">
                                {isLogin ? <Lock size={20} color="white" /> : <Mail size={20} color="white" />}
                                <Text className="text-white font-semibold ml-2">
                                    {isLoading
                                        ? t.auth.pleaseWait
                                        : isLogin
                                            ? t.auth.signIn
                                            : (t.auth.createAccountAndVerify || 'Create Account & Verify Email')
                                    }
                                </Text>
                            </View>
                        </Button>

                        {/* Divider with "or continue with" text */}
                        {isLogin && (
                            <>
                                <View className="flex-row items-center my-2">
                                    <View className="flex-1 h-[1px] bg-gray-200" />
                                    <Text className="mx-4 text-gray-500 text-sm">{t.auth.orContinueWith}</Text>
                                    <View className="flex-1 h-[1px] bg-gray-200" />
                                </View>

                                {/* Phone Login Option */}
                                <TouchableOpacity
                                    onPress={handlePhoneLogin}
                                    className="flex-row items-center justify-center py-3 px-4 border border-gray-200 rounded-xl bg-gray-50"
                                >
                                    <Smartphone size={20} color="#059669" />
                                    <Text className="text-gray-700 font-medium ml-2">
                                        {t.auth.signInWithPhone}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Toggle */}
                        <TouchableOpacity
                            onPress={() => setIsLogin(!isLogin)}
                            className="mt-4 items-center"
                        >
                            <Text className="text-gray-600">
                                {isLogin ? t.auth.dontHaveAccount + " " : t.auth.alreadyHaveAccount + " "}
                                <Text className="text-primary font-semibold">
                                    {isLogin ? t.auth.signUp : t.auth.signIn}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
