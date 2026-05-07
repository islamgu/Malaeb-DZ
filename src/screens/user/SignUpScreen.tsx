import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Mail, Lock, Eye, EyeOff, UserPlus, Check, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../translations';

// Password policy rules
const PASSWORD_RULES = [
    { key: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { key: 'upper', label: 'One uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
    { key: 'lower', label: 'One lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
    { key: 'number', label: 'One number (0-9)', test: (p: string) => /\d/.test(p) },
    { key: 'symbol', label: 'One special character (!@#$...)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

export const SignUpScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { signUp } = useAuth();
    const { t, isRTL } = useTranslation();

    const [email, setEmail] = useState(route.params?.email || '');
    const [password, setPassword] = useState(route.params?.password || '');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Compute which password rules pass
    const passwordChecks = useMemo(() => {
        return PASSWORD_RULES.map(rule => ({
            ...rule,
            passed: rule.test(password),
        }));
    }, [password]);

    const allRulesPassed = passwordChecks.every(r => r.passed);

    const handleSubmit = async () => {
        // Validate email
        if (!email.trim()) {
            Alert.alert(t.common.error, t.auth.enterEmail || 'Please enter your email');
            return;
        }
        if (!validateEmail(email.trim())) {
            Alert.alert(t.common.error, t.auth.invalidEmail || 'Please enter a valid email');
            return;
        }

        // Validate password
        if (!allRulesPassed) {
            Alert.alert(t.common.error, 'Password does not meet all requirements.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await signUp(email.trim(), password);

            if (result.success) {
                navigation.navigate('EmailVerification', {
                    email: email.trim(),
                });
            } else {
                Alert.alert(t.common.error, result.error || t.auth.authFailed || 'Failed to create account');
            }
        } catch (error) {
            Alert.alert(t.common.error, t.auth.somethingWentWrong);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            className="flex-1"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ScrollView
                className="flex-1 bg-white"
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: insets.top + 32,
                    paddingBottom: insets.bottom + 120,
                    paddingHorizontal: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
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
                            {t.auth.createAccount || 'Create Account'}
                        </Text>
                        <Text className="text-gray-600 text-center">
                            {t.auth.enterDetailsToSignUp || 'Enter your details to get started'}
                        </Text>
                    </View>

                    {/* Form Inputs */}
                    <View className="gap-4">
                        {/* Email Input */}
                        <View>
                            <Text className="text-sm text-gray-700 mb-2">
                                {t.auth.email || 'Email'}
                            </Text>
                            <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
                                <Mail size={20} color="#9CA3AF" />
                                <Input
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder={t.auth.emailPlaceholder || "example@email.com"}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 0 }}
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View>
                            <Text className="text-sm text-gray-700 mb-2">
                                {t.auth.password || 'Password'}
                            </Text>
                            <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
                                <Lock size={20} color="#9CA3AF" />
                                <Input
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder={t.auth.passwordPlaceholder || "Enter password"}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
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
                        </View>

                        {/* Password Strength Checklist */}
                        {password.length > 0 && (
                            <View style={{
                                backgroundColor: '#F9FAFB',
                                borderRadius: 12,
                                padding: 12,
                                gap: 6,
                            }}>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 2 }}>
                                    Password Requirements
                                </Text>
                                {passwordChecks.map((rule) => (
                                    <View key={rule.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        {rule.passed ? (
                                            <Check size={16} color="#10B981" />
                                        ) : (
                                            <X size={16} color="#EF4444" />
                                        )}
                                        <Text style={{
                                            fontSize: 13,
                                            color: rule.passed ? '#10B981' : '#6B7280',
                                        }}>
                                            {rule.label}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <Button
                            onPress={handleSubmit}
                            disabled={isLoading || !email.trim() || !allRulesPassed}
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

                        {/* Login Link */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login', { email, password })}
                            className="mt-4"
                        >
                            <Text className="text-center text-gray-600">
                                {t.auth.alreadyHaveAccount || 'Already have an account?'}{' '}
                                <Text className="text-primary font-semibold">{t.auth.signIn || 'Sign In'}</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
