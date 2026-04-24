import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert, Image, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../translations';

export const SignUpScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { register } = useAuth();
    const { t, isRTL } = useTranslation();
    const scrollViewRef = useRef<any>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async () => {
        // Validate email
        if (!email.trim()) {
            Alert.alert(t.common.error, 'Please enter your email');
            return;
        }
        if (!validateEmail(email.trim())) {
            Alert.alert(t.common.error, t.auth.invalidEmail || 'Please enter a valid email');
            return;
        }

        // Validate password
        if (!password || password.length < 4) {
            Alert.alert(t.common.error, t.auth.passwordMinLength || 'Password must be at least 4 characters');
            return;
        }

        setIsLoading(true);
        try {
            const result = await register(email.trim(), password, "User");

            if (result.success) {
                navigation.navigate('EmailVerification', {
                    email: email.trim(),
                });
            } else {
                Alert.alert(t.common.error, result.error || t.auth.authFailed || 'Failed to create account');
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

    return (
        <KeyboardAwareScrollView
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
            enableOnAndroid={true}
            extraScrollHeight={20}
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
                        {t.auth.createAccount}
                    </Text>
                    <Text className="text-gray-600 text-center">
                        {t.auth.signUpToGetStarted}
                    </Text>
                </View>

                {/* Form */}
                <View className="gap-4">
                    <View>
                        <Text className="text-sm text-gray-700 mb-2">{t.auth.email}</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
                            <Mail size={20} color="#9CA3AF" />
                            <Input
                                value={email}
                                onChangeText={setEmail}
                                placeholder="your@email.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 0 }}
                            />
                        </View>
                    </View>

                    <View>
                        <Text className="text-sm text-gray-700 mb-2">{t.auth.password}</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
                            <Lock size={20} color="#9CA3AF" />
                            <Input
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                secureTextEntry={!showPassword}
                                style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 0 }}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                {showPassword ? (
                                    <EyeOff size={20} color="#9CA3AF" />
                                ) : (
                                    <Eye size={20} color="#9CA3AF" />
                                )}
                            </TouchableOpacity>
                        </View>
                        <Text className="text-xs text-gray-500 mt-1">
                            {t.auth.passwordHint || 'At least 6 characters'}
                        </Text>
                    </View>

                    <Button
                        onPress={handleSubmit}
                        disabled={isLoading || !email.trim() || password.length < 4}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <View className="flex-row items-center">
                                <UserPlus size={20} color="white" />
                                <Text className="text-white font-semibold ml-2">
                                    {t.auth.signUp || 'Sign Up'}
                                </Text>
                            </View>
                        )}
                    </Button>

                    {/* Info Text */}
                    <Text className="text-gray-500 text-center text-sm mt-2">
                        {t.auth.verificationEmailInfo || 'We will send you a verification link via email'}
                    </Text>

                    {/* Toggle */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Login')}
                        className="mt-4 items-center"
                    >
                        <Text className="text-gray-600">
                            {t.auth.alreadyHaveAccount || 'Already have an account?'} <Text className="text-primary font-semibold">{t.auth.signIn || 'Sign In'}</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAwareScrollView>
    );
};
